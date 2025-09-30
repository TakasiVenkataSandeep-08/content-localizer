// Welcome Webview Script

import { VSCodeWebviewMessage } from "../../../types/vscode-webview";

(function () {
  "use strict";

  const vscode = acquireVsCodeApi();

  // DOM elements
  const createConfigBtn = document.querySelector(
    'button[onclick="createConfig()"]'
  ) as HTMLButtonElement | null;
  const openDocsBtn = document.querySelector(
    'button[onclick="openDocs()"]'
  ) as HTMLButtonElement | null;
  const dismissBtn = document.querySelector(
    'button[onclick="dismiss()"]'
  ) as HTMLButtonElement | null;

  // Make functions globally available
  (window as any).createConfig = function () {
    vscode.postMessage({ command: "createConfig" });
  };

  (window as any).openDocs = function () {
    vscode.postMessage({ command: "openDocs" });
  };

  (window as any).dismiss = function () {
    vscode.postMessage({ command: "dismiss" });
  };

  // Add click event listeners as backup
  if (createConfigBtn) {
    createConfigBtn.addEventListener("click", function (e: MouseEvent) {
      e.preventDefault();
      vscode.postMessage({ command: "createConfig" });
    });
  }

  if (openDocsBtn) {
    openDocsBtn.addEventListener("click", function (e: MouseEvent) {
      e.preventDefault();
      vscode.postMessage({ command: "openDocs" });
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener("click", function (e: MouseEvent) {
      e.preventDefault();
      vscode.postMessage({ command: "dismiss" });
    });
  }

  // Add smooth scrolling and interactive elements
  document.addEventListener("DOMContentLoaded", function () {
    // Add hover effects and animations
    const featureCards = document.querySelectorAll(
      ".feature-card, .step-card, .feature-item"
    );
    featureCards.forEach((card: Element) => {
      card.addEventListener("mouseenter", function (this: Element) {
        (this as HTMLElement).style.transform = "translateY(-4px)";
      });

      card.addEventListener("mouseleave", function (this: Element) {
        (this as HTMLElement).style.transform = "translateY(0)";
      });
    });

    // Add click animations to buttons
    const buttons = document.querySelectorAll(".btn-primary, .btn-secondary");
    buttons.forEach((button: Element) => {
      button.addEventListener("mousedown", function (this: Element) {
        (this as HTMLElement).style.transform = "scale(0.98)";
      });

      button.addEventListener("mouseup", function (this: Element) {
        (this as HTMLElement).style.transform = "";
      });

      button.addEventListener("mouseleave", function (this: Element) {
        (this as HTMLElement).style.transform = "";
      });
    });

    // Add language button interactions
    const langButtons = document.querySelectorAll(".lang-btn");
    langButtons.forEach((btn: Element) => {
      btn.addEventListener("click", function (this: Element) {
        // Visual feedback
        (this as HTMLElement).style.backgroundColor = "var(--primary-color)";
        (this as HTMLElement).style.color = "white";

        setTimeout(() => {
          (this as HTMLElement).style.backgroundColor = "";
          (this as HTMLElement).style.color = "";
        }, 200);
      });
    });
  });

  // Add keyboard navigation
  document.addEventListener("keydown", function (e: KeyboardEvent) {
    // ESC to dismiss
    if (e.key === "Escape") {
      vscode.postMessage({ command: "dismiss" });
    }

    // Enter on focused button
    if (e.key === "Enter") {
      const focusedElement = document.activeElement;
      if (focusedElement && focusedElement.tagName === "BUTTON") {
        (focusedElement as HTMLButtonElement).click();
      }
    }
  });

  // Focus management
  const firstButton = document.querySelector(
    ".btn-primary"
  ) as HTMLButtonElement | null;
  if (firstButton) {
    firstButton.focus();
  }

  // Track user interactions for analytics (optional)
  const trackInteraction = function (action: string, element: string) {
    // Could send telemetry data to extension
    console.log(`User interaction: ${action} on ${element}`);
  };

  // Add interaction tracking
  document.addEventListener("click", function (e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      target.classList.contains("btn-primary") ||
      target.classList.contains("btn-secondary") ||
      target.classList.contains("btn-link")
    ) {
      trackInteraction("click", target.textContent?.trim() || "");
    }
  });
})();
