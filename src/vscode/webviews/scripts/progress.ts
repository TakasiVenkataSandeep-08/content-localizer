// Progress Webview Script

import { VSCodeWebviewMessage } from "../../../types/vscode-webview";

interface ProgressUpdate {
  current: number;
  total: number;
  file?: string;
  status: "processing" | "completed" | "error";
  message?: string;
}

interface TranslationResult {
  success: boolean;
  message?: string;
}

(function () {
  "use strict";

  const vscode = acquireVsCodeApi<ProgressUpdate>();

  // DOM elements
  const overallPercentage = document.getElementById(
    "overall-percentage"
  ) as HTMLSpanElement;
  const overallProgressFill = document.getElementById(
    "overall-progress-fill"
  ) as HTMLDivElement;
  const currentFile = document.getElementById(
    "current-file"
  ) as HTMLSpanElement;
  const filesCount = document.getElementById("files-count") as HTMLSpanElement;
  const statusIcon = document.getElementById("status-icon") as HTMLDivElement;
  const statusTitle = document.getElementById(
    "status-title"
  ) as HTMLHeadingElement;
  const statusMessage = document.getElementById(
    "status-message"
  ) as HTMLParagraphElement;
  const fileItems = document.getElementById("file-items") as HTMLDivElement;
  const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement;
  const showResultsBtn = document.getElementById(
    "showResultsBtn"
  ) as HTMLButtonElement;
  const completionMessage = document.getElementById(
    "completion-message"
  ) as HTMLDivElement;
  const completionIcon = document.getElementById(
    "completion-icon"
  ) as HTMLDivElement;
  const completionTitle = document.getElementById(
    "completion-title"
  ) as HTMLHeadingElement;
  const completionDescription = document.getElementById(
    "completion-description"
  ) as HTMLParagraphElement;
  const completionStats = document.getElementById(
    "completion-stats"
  ) as HTMLDivElement;

  let currentProgress = {
    current: 0,
    total: 0,
    processedFiles: [] as string[],
    isComplete: false,
  };

  // Initialize
  setupEventListeners();

  function setupEventListeners() {
    cancelBtn.addEventListener("click", () => {
      vscode.postMessage({ command: "cancelTranslation" });
    });

    showResultsBtn.addEventListener("click", () => {
      vscode.postMessage({ command: "showResults" });
    });
  }

  function updateProgress(update: ProgressUpdate) {
    currentProgress.current = update.current;
    currentProgress.total = update.total;

    // Update overall progress
    const percentage =
      currentProgress.total > 0
        ? Math.round((currentProgress.current / currentProgress.total) * 100)
        : 0;
    overallPercentage.textContent = `${percentage}%`;
    overallProgressFill.style.width = `${percentage}%`;

    // Update file count
    filesCount.textContent = `${currentProgress.current} / ${currentProgress.total} files`;

    // Update current file
    if (update.file) {
      currentFile.textContent = getFileName(update.file);
    }

    // Update status
    updateStatus(update);

    // Add to file list
    if (update.file) {
      addFileItem(update);
    }
  }

  function updateStatus(update: ProgressUpdate) {
    const statusMap = {
      processing: {
        icon: "spinner",
        title: "Processing",
        message: `Translating ${getFileName(update.file || "")}`,
      },
      completed: {
        icon: "success",
        title: "Completed",
        message: `Successfully translated ${getFileName(update.file || "")}`,
      },
      error: {
        icon: "error",
        title: "Error",
        message:
          update.message ||
          `Failed to translate ${getFileName(update.file || "")}`,
      },
    };

    const status = statusMap[update.status] || statusMap.processing;

    // Update icon
    statusIcon.className = `status-icon ${status.icon}`;
    statusIcon.innerHTML =
      status.icon === "spinner"
        ? '<div class="spinner"></div>'
        : status.icon === "success"
        ? "✓"
        : status.icon === "error"
        ? "✕"
        : "";

    // Update text
    statusTitle.textContent = status.title;
    statusMessage.textContent = status.message;
  }

  function addFileItem(update: ProgressUpdate) {
    const existingItem = document.querySelector(
      `[data-file="${update.file}"]`
    ) as HTMLDivElement | null;
    if (existingItem) {
      // Update existing item
      existingItem.className = `file-item ${update.status}`;
      const icon = existingItem.querySelector(".file-icon") as HTMLDivElement;
      const status = existingItem.querySelector(
        ".file-status"
      ) as HTMLDivElement;

      icon.className = `file-icon ${update.status}`;
      icon.textContent =
        update.status === "completed"
          ? "✓"
          : update.status === "error"
          ? "✕"
          : "⟳";

      status.textContent =
        update.status === "completed"
          ? "Completed"
          : update.status === "error"
          ? update.message || "Error"
          : "Processing...";

      // Move to top
      fileItems.insertBefore(existingItem, fileItems.firstChild);
    } else {
      // Create new item
      const item = document.createElement("div");
      item.className = `file-item ${update.status}`;
      item.setAttribute("data-file", update.file || "");

      const time = new Date().toLocaleTimeString();

      item.innerHTML = `
                 <div class="file-icon ${update.status}">
                     ${
                       update.status === "completed"
                         ? "✓"
                         : update.status === "error"
                         ? "✕"
                         : "⟳"
                     }
                 </div>
                 <div class="file-info">
                     <div class="file-name">${getFileName(
                       update.file || ""
                     )}</div>
                     <div class="file-status">
                         ${
                           update.status === "completed"
                             ? "Completed"
                             : update.status === "error"
                             ? update.message || "Error"
                             : "Processing..."
                         }
                     </div>
                 </div>
                 <div class="file-time">${time}</div>
             `;

      // Add to top of list
      fileItems.insertBefore(item, fileItems.firstChild);

      // Keep only last 10 items
      while (fileItems.children.length > 10) {
        fileItems.removeChild(fileItems.lastChild);
      }
    }
  }

  function showCompletion(
    success: boolean,
    message?: string,
    results?: TranslationResult[]
  ) {
    currentProgress.isComplete = true;

    // Hide progress section
    document.querySelector(".progress-section").style.display = "none";
    document.querySelector(".file-list").style.display = "none";
    cancelBtn.style.display = "none";

    // Show completion message
    completionMessage.style.display = "block";

    // Update completion UI
    completionIcon.className = `completion-icon ${
      success ? "success" : "error"
    }`;
    completionIcon.innerHTML = success ? "🎉" : "❌";

    completionTitle.textContent = success
      ? "Translation Complete!"
      : "Translation Failed";
    completionDescription.textContent =
      message ||
      (success
        ? "All files have been processed successfully."
        : "Some files failed to translate. Check the results for details.");

    // Show results button
    showResultsBtn.style.display = "inline-flex";

    // Add statistics
    if (results && results.length > 0) {
      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;

      completionStats.innerHTML = `
                 <div class="stat-item">
                     <span class="stat-number">${results.length}</span>
                     <span class="stat-label">Total Files</span>
                 </div>
                 <div class="stat-item">
                     <span class="stat-number">${successful}</span>
                     <span class="stat-label">Successful</span>
                 </div>
                 <div class="stat-item">
                     <span class="stat-number">${failed}</span>
                     <span class="stat-label">Failed</span>
                 </div>
             `;
    }
  }

  function getFileName(filePath: string) {
    if (!filePath) return "Unknown file";
    return filePath.split("/").pop() || filePath.split("\\").pop() || filePath;
  }

  // Handle messages from extension
  window.addEventListener("message", (event: MessageEvent) => {
    const message = event.data as VSCodeWebviewMessage;

    switch (message.command) {
      case "progressUpdate":
        updateProgress(message.update);
        break;
      case "translationComplete":
        showCompletion(message.success, message.message, message.results);
        break;
    }
  });

  // Initial status
  statusTitle.textContent = "Initializing";
  statusMessage.textContent = "Preparing translation process...";
})();
