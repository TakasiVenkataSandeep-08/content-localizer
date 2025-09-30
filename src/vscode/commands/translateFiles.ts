import * as vscode from "vscode";
import * as path from "path";
import {
  ConfigManager,
  TranslationConfig,
} from "../../core/config/ConfigManager";
import { StatusBarManager } from "../utils/StatusBarManager";
import { TranslationService } from "../../core/services/TranslationService";
import { ProgressWebview } from "../webviews/components/ProgressWebview";

interface TranslationResult {
  file: string;
  success: boolean;
  error?: string;
}

/**
 * Command to translate files based on configuration
 */
export async function translateFilesCommand(
  uri: vscode.Uri | undefined,
  statusBarManager: StatusBarManager,
  configManager: ConfigManager
): Promise<void> {
  try {
    // Check if API keys are configured
    const configuredProviders = ["openai", "gemini", "mistral"].filter(
      (provider) => configManager.getApiKey(provider as any)
    );

    if (configuredProviders.length === 0) {
      const setup = await vscode.window.showWarningMessage(
        "No API keys configured. Please set up your API keys in settings.",
        "Open Settings",
        "Cancel"
      );
      if (setup === "Open Settings") {
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "localizer-ai"
        );
      }
      return;
    }

    // Check if workspace has configuration
    const hasConfig = await configManager.hasWorkspaceConfig();
    if (!hasConfig) {
      const createConfig = await vscode.window.showInformationMessage(
        "No translation configuration found. Would you like to create one?",
        "Create Config",
        "Cancel"
      );
      if (createConfig === "Create Config") {
        vscode.commands.executeCommand("localizer-ai.createConfig");
      }
      return;
    }

    // Read configuration
    const config = await configManager.readWorkspaceConfig();
    if (!config) {
      vscode.window.showErrorMessage("Failed to read configuration file.");
      return;
    }

    // Determine target directory
    let targetDir = config.sourceLanguage || "src";
    if (uri) {
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.type === vscode.FileType.Directory) {
        targetDir = vscode.workspace.asRelativePath(uri);
      } else {
        targetDir = path.dirname(vscode.workspace.asRelativePath(uri));
      }
    }

    // Show progress
    statusBarManager.startTranslation();

    // Create progress webview
    const progressWebview = ProgressWebview.createOrShow(
      vscode.Uri.file(__dirname)
    );

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Translating files...",
        cancellable: true,
      },
      async (progress, token) => {
        const translationService = new TranslationService(
          configManager,
          progressWebview
        );

        // Update progress
        progress.report({ increment: 0, message: "Starting translation..." });

        // Perform translation
        const results = await translationService.translateDirectory(
          targetDir,
          config,
          (current: number, total: number) => {
            const increment = (current / total) * 100;
            progress.report({
              increment,
              message: `Translating file ${current} of ${total}...`,
            });
            statusBarManager.updateProgress(current, total);
          },
          token
        );

        // Show results
        const successCount = results.filter(
          (r: TranslationResult) => r.success
        ).length;
        const errorCount = results.length - successCount;

        if (errorCount === 0) {
          vscode.window.showInformationMessage(
            `Translation completed successfully! ${successCount} files translated.`
          );
          statusBarManager.completeTranslation(
            true,
            `${successCount} files translated successfully`
          );
          progressWebview.setTranslationComplete(
            true,
            `${successCount} files translated successfully`,
            results
          );
        } else if (successCount === 0) {
          vscode.window.showErrorMessage(
            `Translation failed. ${errorCount} files had errors.`
          );
          statusBarManager.completeTranslation(false, "Translation failed");
          progressWebview.setTranslationComplete(
            false,
            "Translation failed",
            results
          );
        } else {
          vscode.window
            .showWarningMessage(
              `Translation completed with warnings. ${successCount} successful, ${errorCount} failed.`,
              "Show Details"
            )
            .then((selection) => {
              if (selection === "Show Details") {
                showTranslationDetails(results);
              }
            });
          statusBarManager.completeTranslation(
            true,
            `${successCount}/${results.length} files translated`
          );
          progressWebview.setTranslationComplete(
            true,
            `Translation completed with ${errorCount} errors`,
            results
          );
        }
      }
    );
  } catch (error) {
    const errorMessage = `Translation failed: ${(error as Error).message}`;
    vscode.window.showErrorMessage(errorMessage);
    statusBarManager.completeTranslation(false, errorMessage);
  }
}

/**
 * Show detailed results of translation
 */
function showTranslationDetails(results: TranslationResult[]): void {
  const outputChannel = vscode.window.createOutputChannel(
    "Localizer AI Translation Results"
  );
  outputChannel.clear();
  outputChannel.appendLine("=== Translation Results ===\n");

  results.forEach((result, index) => {
    const status = result.success ? "✅" : "❌";
    outputChannel.appendLine(`${status} ${result.file}`);
    if (result.error) {
      outputChannel.appendLine(`   Error: ${result.error}`);
    }
    outputChannel.appendLine("");
  });

  outputChannel.appendLine(
    `\nSummary: ${results.filter((r) => r.success).length}/${
      results.length
    } successful`
  );
  outputChannel.show();
}
