import * as vscode from "vscode";

/**
 * Command to open VS Code settings for Localizer AI
 */
export function openSettingsCommand(): void {
  vscode.commands.executeCommand(
    "workbench.action.openSettings",
    "@ext:localizer-ai.localizer-ai"
  );
}


