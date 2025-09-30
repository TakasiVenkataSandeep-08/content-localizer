import * as vscode from "vscode";
import { ConfigManager } from "../utils/ConfigManager";

/**
 * Command to reset all stored API keys
 */
export function resetKeysCommand(configManager: ConfigManager): void {
  const confirm = vscode.window
    .showWarningMessage(
      "This will clear all stored API keys. You will need to enter them again for future translations. Continue?",
      "Reset Keys",
      "Cancel"
    )
    .then((selection) => {
      if (selection === "Reset Keys") {
        configManager.resetApiKeys();
        vscode.window.showInformationMessage(
          "API keys have been reset. You will be prompted for them on next use."
        );
      }
    });
}


