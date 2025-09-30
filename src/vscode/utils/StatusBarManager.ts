import * as vscode from "vscode";

export class StatusBarManager {
  public statusBarItem: vscode.StatusBarItem;
  private isTranslating: boolean = false;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
  }

  /**
   * Initialize the status bar
   */
  initialize(): void {
    this.statusBarItem.text = "$(globe) Localizer AI";
    this.statusBarItem.tooltip = "Localizer AI - Ready to translate";
    this.statusBarItem.command = "localizer-ai.createConfig";
    this.statusBarItem.show();
  }

  /**
   * Update status bar for translation start
   */
  startTranslation(): void {
    this.isTranslating = true;
    this.statusBarItem.text = "$(loading~spin) Translating...";
    this.statusBarItem.tooltip = "Translation in progress...";
    this.statusBarItem.command = undefined;
  }

  /**
   * Update status bar for translation completion
   */
  completeTranslation(success: boolean, message?: string): void {
    this.isTranslating = false;

    if (success) {
      this.statusBarItem.text = "$(check) Translation Complete";
      this.statusBarItem.tooltip =
        message || "Translation completed successfully";
    } else {
      this.statusBarItem.text = "$(error) Translation Failed";
      this.statusBarItem.tooltip = message || "Translation failed";
    }

    // Reset after 3 seconds
    setTimeout(() => {
      if (!this.isTranslating) {
        this.statusBarItem.text = "$(globe) Localizer AI";
        this.statusBarItem.tooltip = "Localizer AI - Ready to translate";
        this.statusBarItem.command = "localizer-ai.createConfig";
      }
    }, 3000);
  }

  /**
   * Update status bar with progress information
   */
  updateProgress(current: number, total: number): void {
    if (this.isTranslating) {
      this.statusBarItem.text = `$(loading~spin) Translating... ${current}/${total}`;
      this.statusBarItem.tooltip = `Translation in progress: ${current} of ${total} files`;
    }
  }

  /**
   * Get status bar item for subscriptions
   */
  getStatusBarItem(): vscode.StatusBarItem {
    return this.statusBarItem;
  }

  /**
   * Dispose of status bar item
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}


