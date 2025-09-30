import * as vscode from "vscode";
import { ConfigWizardWebview } from "./vscode/webviews/components/ConfigWizardWebview";
import { WelcomeWebview } from "./vscode/webviews/components/WelcomeWebview";
import { translateFilesCommand } from "./vscode/commands/translateFiles";
import { openSettingsCommand } from "./vscode/commands/openSettings";
import { resetKeysCommand } from "./vscode/commands/resetKeys";
import { StatusBarManager } from "./vscode/utils/StatusBarManager";
import { ConfigManager } from "./core/config/ConfigManager";

let statusBarManager: StatusBarManager;
let configManager: ConfigManager;

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("Localizer AI extension is now active!");

  const extensionUri = context.extensionUri;

  // Initialize managers
  statusBarManager = new StatusBarManager();
  configManager = new ConfigManager();

  // Register commands
  const createConfig = vscode.commands.registerCommand(
    "localizer-ai.createConfig",
    () => ConfigWizardWebview.createOrShow(extensionUri, configManager)
  );

  const translateFiles = vscode.commands.registerCommand(
    "localizer-ai.translateFiles",
    (uri: vscode.Uri) =>
      translateFilesCommand(uri, statusBarManager, configManager)
  );

  const openSettings = vscode.commands.registerCommand(
    "localizer-ai.openSettings",
    () => openSettingsCommand()
  );

  const resetKeys = vscode.commands.registerCommand(
    "localizer-ai.resetKeys",
    () => resetKeysCommand(configManager)
  );

  const showWelcome = vscode.commands.registerCommand(
    "localizer-ai.showWelcome",
    () => WelcomeWebview.createOrShow(context.extensionUri)
  );

  // Add commands to subscriptions
  context.subscriptions.push(
    createConfig,
    translateFiles,
    openSettings,
    resetKeys,
    showWelcome,
    statusBarManager.getStatusBarItem()
  );

  // Initialize status bar
  statusBarManager.initialize();

  // Show welcome message on first activation
  showWelcomeMessage(context);
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate() {
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}

/**
 * Show welcome webview for first-time users
 */
function showWelcomeMessage(context: vscode.ExtensionContext) {
  const hasShownWelcome = context.globalState.get(
    "localizer-ai.welcomeShown",
    false
  );

  if (!hasShownWelcome) {
    // Show welcome webview
    WelcomeWebview.createOrShow(context.extensionUri);

    // Mark as shown
    context.globalState.update("localizer-ai.welcomeShown", true);
  }
}
