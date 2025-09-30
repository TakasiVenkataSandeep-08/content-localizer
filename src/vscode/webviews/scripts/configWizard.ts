// Configuration Wizard Webview Script

import { VSCodeWebviewMessage } from "../../../types/vscode-webview";

interface FormData {
  sourceLanguage: string;
  targetLanguages: string[];
  fileTypes: string[];
  aiProvider: "openai" | "gemini" | "mistral";
  batchSize: number;
  source?: string;
  outputDirectory?: string;
  apiKeys?: Record<string, string>;
}

(function () {
  "use strict";

  const vscode = acquireVsCodeApi<FormData>();

  // DOM elements
  const form = document.getElementById("configForm") as HTMLFormElement;
  const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement;
  const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement;
  const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
  const messageDiv = document.getElementById("message") as HTMLDivElement;

  // Form steps
  const steps = document.querySelectorAll(".step");
  const progressSteps = document.querySelectorAll(".progress-step");
  let currentStep = 1;
  const totalSteps = 4;

  // Form data
  let formData: FormData = {
    sourceLanguage: "en",
    targetLanguages: [],
    fileTypes: [".json", ".md"],
    aiProvider: "openai",
    batchSize: 10,
  };

  // Initialize
  initializeForm();
  setupEventListeners();
  loadExistingConfiguration();

  function initializeForm() {
    // Set default values
    document.getElementById("sourceLanguage").value = formData.sourceLanguage;
    document.getElementById("batchSize").value = formData.batchSize;

    // Initialize checkboxes
    document
      .querySelectorAll('.checkbox-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = formData.fileTypes.includes(checkbox.value);
      });

    updateUI();
  }

  function setupEventListeners() {
    // Navigation buttons
    prevBtn.addEventListener("click", () => navigateStep(currentStep - 1));
    nextBtn.addEventListener("click", () => {
      if (validateCurrentStep()) {
        navigateStep(currentStep + 1);
      }
    });
    saveBtn.addEventListener("click", saveConfiguration);

    // Form inputs
    document
      .getElementById("languageInput")
      .addEventListener("keydown", handleLanguageInput);
    document
      .getElementById("addLanguage")
      .addEventListener("click", addLanguage);

    // Language buttons
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => addLanguage(btn.dataset.lang));
    });

    // Provider selection
    document.querySelectorAll('input[name="provider"]').forEach((radio) => {
      radio.addEventListener("change", handleProviderChange);
    });

    // API key validation
    document
      .getElementById("validateKey")
      .addEventListener("click", validateApiKey);

    // File type checkboxes
    document
      .querySelectorAll('.checkbox-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.addEventListener("change", updateFileTypes);
      });
  }

  function navigateStep(step: number) {
    if (step < 1 || step > totalSteps) return;

    // Update steps
    steps.forEach((s) => s.classList.remove("active"));
    progressSteps.forEach((p) => p.classList.remove("active", "completed"));

    document
      .querySelector(`.step[data-step="${step}"]`)
      .classList.add("active");

    // Update progress
    for (let i = 1; i <= step; i++) {
      const progressStep = document.querySelector(
        `.progress-step[data-step="${i}"]`
      );
      if (i < step) {
        progressStep.classList.add("completed");
      } else if (i === step) {
        progressStep.classList.add("active");
      }
    }

    currentStep = step;
    updateUI();
  }

  function updateUI() {
    // Update navigation buttons
    prevBtn.disabled = currentStep === 1;
    nextBtn.style.display = currentStep === totalSteps ? "none" : "inline-flex";
    saveBtn.style.display = currentStep === totalSteps ? "inline-flex" : "none";

    // Update form data from current step
    updateFormData();
  }

  function validateCurrentStep() {
    const currentStepEl = document.querySelector(
      `.step[data-step="${currentStep}"]`
    );
    const requiredInputs = currentStepEl.querySelectorAll(
      "input[required], select[required]"
    );

    for (const input of requiredInputs) {
      if (!input.value.trim()) {
        showMessage(`Please fill in all required fields.`, "warning");
        input.focus();
        return false;
      }
    }

    // Special validation for step 3 (languages)
    if (currentStep === 3 && formData.targetLanguages.length === 0) {
      showMessage("Please add at least one target language.", "warning");
      return false;
    }

    return true;
  }

  function updateFormData() {
    // Update from form inputs
    formData.sourceLanguage = document.getElementById("sourceLanguage").value;
    formData.batchSize =
      parseInt(document.getElementById("batchSize").value) || 10;

    // Update source directory
    const sourceDir = document.getElementById("sourceDir").value.trim();
    if (sourceDir) {
      formData.source = sourceDir;
    }

    // Update output directory
    const outputDir = document.getElementById("outputDir").value.trim();
    if (outputDir) {
      formData.outputDirectory = outputDir;
    }

    // Update provider
    const selectedProvider = document.querySelector(
      'input[name="provider"]:checked'
    );
    if (selectedProvider) {
      formData.aiProvider = selectedProvider.value as FormData["aiProvider"];
    }
  }

  function updateFileTypes() {
    const checkedBoxes = document.querySelectorAll(
      '.checkbox-item input[type="checkbox"]:checked'
    );
    formData.fileTypes = Array.from(checkedBoxes).map((cb) => cb.value);
  }

  function handleLanguageInput(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      const languages = input.value
        .split(",")
        .map((lang) => lang.trim())
        .filter((lang) => lang);
      languages.forEach((lang) => addLanguage(lang));
      input.value = "";
    }
  }

  function addLanguage(langCode: string) {
    if (!langCode || formData.targetLanguages.includes(langCode)) return;

    // Validate language code
    if (!/^[a-z]{2,3}(-[a-z]{2,3})?$/.test(langCode)) {
      showMessage(`Invalid language code: ${langCode}`, "warning");
      return;
    }

    formData.targetLanguages.push(langCode);
    updateLanguageTags();
  }

  function updateLanguageTags() {
    const container = document.getElementById("languageTags");
    if (!container) return;

    container.innerHTML = "";

    formData.targetLanguages.forEach((lang) => {
      const tag = document.createElement("span");
      tag.className = "language-tag";
      tag.innerHTML = `
                ${lang}
                <span class="remove" data-lang="${lang}">×</span>
            `;

      tag.querySelector(".remove").addEventListener("click", () => {
        removeLanguage(lang);
      });

      container.appendChild(tag);
    });
  }

  function removeLanguage(langCode: string) {
    formData.targetLanguages = formData.targetLanguages.filter(
      (lang) => lang !== langCode
    );
    updateLanguageTags();
  }

  function handleProviderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const provider = target.value as FormData["aiProvider"];
    formData.aiProvider = provider;

    // Update API key placeholder based on provider
    const apiKeyInput = document.getElementById("apiKey");
    const placeholders: Record<FormData["aiProvider"], string> = {
      openai: "sk-...",
      gemini: "AIza...",
      mistral: "your-mistral-key",
    };

    if (apiKeyInput) {
      apiKeyInput.placeholder = `Enter your ${provider} API key (${
        placeholders[provider] || "API key"
      })`;
    }
  }

  async function validateApiKey() {
    const apiKeyInput = document.getElementById("apiKey");
    if (!apiKeyInput) return;

    const apiKey = apiKeyInput.value.trim();
    const statusEl = document.getElementById("keyStatus");

    if (!apiKey) {
      if (statusEl) {
        statusEl.textContent = "Please enter an API key";
        statusEl.className = "invalid";
      }
      return;
    }

    if (statusEl) {
      statusEl.textContent = "Validating...";
      statusEl.className = "";
    }

    try {
      await vscode.postMessage({
        command: "validateApiKey",
        provider: formData.aiProvider,
        apiKey: apiKey,
      });
    } catch (error) {
      if (statusEl) {
        statusEl.textContent = "Validation failed";
        statusEl.className = "invalid";
      }
    }
  }

  async function saveConfiguration() {
    // Update API key in form data
    const apiKeyInput = document.getElementById("apiKey");
    if (apiKeyInput) {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        formData.apiKeys = {
          [formData.aiProvider]: apiKey,
        };
      }
    }

    try {
      await vscode.postMessage({
        command: "saveConfig",
        config: formData,
      });
    } catch (error) {
      showMessage("Failed to save configuration", "error");
    }
  }

  async function loadExistingConfiguration() {
    try {
      await vscode.postMessage({
        command: "loadExistingConfig",
      });
    } catch (error) {
      // Ignore errors for loading existing config
    }
  }

  function showMessage(
    text: string,
    type: "info" | "warning" | "success" | "error" = "info"
  ) {
    if (messageDiv) {
      messageDiv.textContent = text;
      messageDiv.className = `message ${type}`;
      messageDiv.style.display = "block";

      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 5000);
    }
  }

  // Handle messages from extension
  window.addEventListener("message", (event: MessageEvent) => {
    const message = event.data as VSCodeWebviewMessage;

    switch (message.command) {
      case "loadConfig":
        loadConfiguration(message.config);
        break;
      case "configSaved":
        showMessage(message.message, "success");
        break;
      case "validationError":
        showMessage(`Validation errors: ${message.errors.join(", ")}`, "error");
        break;
      case "apiKeyValidation":
        handleApiKeyValidation(message);
        break;
      case "error":
        showMessage(message.message, "error");
        break;
    }
  });

  function loadConfiguration(config: FormData) {
    if (config.source) {
      document.getElementById("sourceDir").value = config.source;
    }
    if (config.outputDirectory) {
      document.getElementById("outputDir").value = config.outputDirectory;
    }
    if (config.sourceLanguage) {
      document.getElementById("sourceLanguage").value = config.sourceLanguage;
      formData.sourceLanguage = config.sourceLanguage;
    }
    if (config.targetLanguages) {
      formData.targetLanguages = config.targetLanguages;
      updateLanguageTags();
    }
    if (config.fileTypes) {
      formData.fileTypes = config.fileTypes;
      // Update checkboxes
      document
        .querySelectorAll('.checkbox-item input[type="checkbox"]')
        .forEach((checkbox) => {
          checkbox.checked = config.fileTypes.includes(checkbox.value);
        });
    }
    if (config.aiProvider) {
      formData.aiProvider = config.aiProvider;
      document.querySelector(
        `input[name="provider"][value="${config.aiProvider}"]`
      ).checked = true;
    }
    if (config.batchSize) {
      formData.batchSize = config.batchSize;
      document.getElementById("batchSize").value = config.batchSize;
    }
  }

  function handleApiKeyValidation(message: VSCodeWebviewMessage) {
    const statusEl = document.getElementById("keyStatus");
    if (statusEl) {
      statusEl.textContent = message.message;
      statusEl.className = message.isValid ? "valid" : "invalid";
    }
  }

  // Initialize language tags
  updateLanguageTags();
})();
