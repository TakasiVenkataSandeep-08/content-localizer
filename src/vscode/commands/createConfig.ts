import * as vscode from "vscode";
import { ConfigManager, TranslationConfig } from "../utils/ConfigManager";

/**
 * Command to create a new translation configuration file
 */
export async function createConfigCommand(
  configManager: ConfigManager
): Promise<void> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(
        "No workspace folder is open. Please open a folder first."
      );
      return;
    }

    // Check if config already exists
    const hasConfig = await configManager.hasWorkspaceConfig();
    if (hasConfig) {
      const overwrite = await vscode.window.showWarningMessage(
        "A configuration file already exists. Do you want to overwrite it?",
        "Overwrite",
        "Cancel"
      );
      if (overwrite !== "Overwrite") {
        return;
      }
    }

    // Get configuration from user
    const config = await getConfigurationFromUser(configManager);
    if (!config) {
      return;
    }

    // Write configuration file
    await configManager.writeWorkspaceConfig(config);

    vscode.window
      .showInformationMessage(
        'Translation configuration created successfully! You can now use "Translate Files" to start translating.',
        "Start Translating"
      )
      .then((selection) => {
        if (selection === "Start Translating") {
          vscode.commands.executeCommand("localizer-ai.translateFiles");
        }
      });
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to create configuration: ${(error as Error).message}`
    );
  }
}

/**
 * Get configuration from user through interactive prompts
 */
async function getConfigurationFromUser(
  configManager: ConfigManager
): Promise<TranslationConfig | null> {
  // Source directory
  const sourceDir = await vscode.window.showInputBox({
    prompt: "Source directory path (relative to workspace root)",
    placeHolder: "src, docs, locales, etc.",
    value: "src",
    validateInput: (value: string) => {
      if (!value || value.trim() === "") {
        return "Source directory is required";
      }
      return null;
    },
  });

  if (!sourceDir) return null;

  // File types
  const fileTypesInput = await vscode.window.showInputBox({
    prompt: "File extensions to translate (comma-separated)",
    placeHolder: ".json,.md,.txt,.js,.ts",
    value: ".json,.md,.txt",
    validateInput: (value: string) => {
      if (!value || value.trim() === "") {
        return "At least one file type is required";
      }
      const types = value.split(",").map((t) => t.trim());
      const invalid = types.filter((t) => !t.startsWith("."));
      if (invalid.length > 0) {
        return `File types must start with '.': ${invalid.join(", ")}`;
      }
      return null;
    },
  });

  if (!fileTypesInput) return null;

  // Target languages
  const localesInput = await vscode.window.showInputBox({
    prompt: "Target language codes (comma-separated)",
    placeHolder: "es,fr,de,zh,ja",
    value: configManager.getTargetLanguages().join(","),
    validateInput: (value: string) => {
      if (!value || value.trim() === "") {
        return "At least one target language is required";
      }
      const locales = value.split(",").map((l) => l.trim());
      const invalid = locales.filter(
        (l) => !/^[a-z]{2,3}(-[a-z]{2,3})?$/.test(l)
      );
      if (invalid.length > 0) {
        return `Invalid language codes: ${invalid.join(
          ", "
        )}. Use 2-3 letter codes like 'es', 'zh-CN'`;
      }
      return null;
    },
  });

  if (!localesInput) return null;

  // Source language
  const sourceLanguage = await vscode.window.showInputBox({
    prompt: "Source language code",
    placeHolder: "en, es, fr, de, zh",
    value: configManager.getSourceLanguage(),
    validateInput: (value: string) => {
      if (!value || value.trim() === "") {
        return "Source language is required";
      }
      if (!/^[a-z]{2,3}(-[a-z]{2,3})?$/.test(value)) {
        return "Invalid language code. Use 2-3 letter codes like 'en', 'zh-CN'";
      }
      return null;
    },
  });

  if (!sourceLanguage) return null;

  // AI Provider selection
  const aiProvider = await vscode.window.showQuickPick(
    [
      {
        label: "OpenAI",
        description: "GPT models (requires API key)",
        detail: "gpt-4, gpt-3.5-turbo",
      },
      {
        label: "Google Gemini",
        description: "Gemini models (requires API key)",
        detail: "gemini-pro, gemini-1.5-flash",
      },
      {
        label: "MistralAI",
        description: "Mistral models (requires API key)",
        detail: "open-mistral-nemo",
      },
    ],
    {
      placeHolder: "Select AI provider for translations",
      matchOnDescription: true,
    }
  );

  if (!aiProvider) return null;

  // Destination directory (optional)
  const destination = await vscode.window.showInputBox({
    prompt: "Destination directory (optional, leave empty to use source)",
    placeHolder: "localized, translations, i18n",
  });

  // Batch size
  const batchSizeInput = await vscode.window.showInputBox({
    prompt: "Batch size (files to process simultaneously)",
    placeHolder: "1-50",
    value: configManager.getBatchSize().toString(),
    validateInput: (value: string) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 50) {
        return "Batch size must be a number between 1 and 50";
      }
      return null;
    },
  });

  if (!batchSizeInput) return null;

  // Parse inputs
  const fileTypes = fileTypesInput.split(",").map((t) => t.trim());
  const targetLanguages = localesInput.split(",").map((l) => l.trim());

  // Check for API key
  const providerKey = aiProvider.label.toLowerCase().replace(" ", "") as
    | "openai"
    | "google"
    | "mistralai";
  const mappedProvider =
    providerKey === "google"
      ? "gemini"
      : providerKey === "mistralai"
      ? "mistral"
      : "openai";

  if (!configManager.getApiKey(mappedProvider)) {
    const setKey = await vscode.window.showWarningMessage(
      `No API key found for ${aiProvider.label}. Set it now?`,
      "Set API Key",
      "Continue"
    );

    if (setKey === "Set API Key") {
      const apiKey = await vscode.window.showInputBox({
        prompt: `Enter your ${aiProvider.label} API key`,
        password: true,
        placeHolder: "sk-..., AIza..., etc.",
      });

      if (apiKey) {
        configManager.setApiKey(mappedProvider, apiKey);
        vscode.window.showInformationMessage(
          `${aiProvider.label} API key saved securely.`
        );
      }
    }
  }

  // Create configuration object
  const config: TranslationConfig = {
    sourceLanguage: sourceLanguage.trim(),
    targetLanguages,
    fileTypes,
    aiProvider: mappedProvider as "openai" | "gemini" | "mistral",
    batchSize: parseInt(batchSizeInput),
  };

  const finalConfig: TranslationConfig = {
    ...config,
    outputDirectory:
      destination && destination.trim() ? destination.trim() : undefined,
  };

  // Validate configuration
  const errors = configManager.validateConfig(finalConfig);
  if (errors.length > 0) {
    vscode.window.showErrorMessage(
      `Configuration errors: ${errors.join(", ")}`
    );
    return null;
  }

  return finalConfig;
}
