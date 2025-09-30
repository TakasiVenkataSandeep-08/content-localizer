import * as vscode from "vscode";

export interface ProgressUpdate {
  current: number;
  total: number;
  file?: string;
  status: "processing" | "completed" | "error";
  message?: string;
}

export class ProgressWebview {
  public static currentPanel: ProgressWebview | undefined;
  public static readonly viewType = "localizerProgress";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _progressHistory: ProgressUpdate[] = [];

  public static createOrShow(extensionUri: vscode.Uri): ProgressWebview {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ProgressWebview.currentPanel) {
      ProgressWebview.currentPanel._panel.reveal(column);
      return ProgressWebview.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      ProgressWebview.viewType,
      "Translation Progress",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
        ],
      }
    );

    ProgressWebview.currentPanel = new ProgressWebview(panel, extensionUri);
    return ProgressWebview.currentPanel;
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "cancelTranslation":
            this._cancelTranslation();
            return;
          case "showResults":
            this._showResults();
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose(): void {
    ProgressWebview.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  public updateProgress(update: ProgressUpdate): void {
    this._progressHistory.push(update);
    this._panel.webview.postMessage({
      command: "progressUpdate",
      update: update,
      history: this._progressHistory.slice(-10), // Keep last 10 updates
    });
  }

  public setTranslationComplete(
    success: boolean,
    message?: string,
    results?: any[]
  ): void {
    this._panel.webview.postMessage({
      command: "translationComplete",
      success: success,
      message: message,
      results: results,
    });
  }

  private _update(): void {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _cancelTranslation(): void {
    vscode.commands.executeCommand("localizer-ai.cancelTranslation");
  }

  private _showResults(): void {
    vscode.commands.executeCommand("localizer-ai.showResults");
  }

  private _getHtmlForWebview(webview: vscode.WebviewPanel["webview"]): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "progress.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "progress.js")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Translation Progress</title>
        </head>
        <body>
            <div class="container">
                <header class="header">
                    <div class="logo">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#007ACC"/>
                            <path d="M2 17L12 22L22 17" stroke="#007ACC" stroke-width="2"/>
                            <path d="M2 12L12 17L22 12" stroke="#007ACC" stroke-width="2"/>
                        </svg>
                        <h1>Localizer AI</h1>
                    </div>
                    <p>Translation in progress...</p>
                </header>

                <div class="progress-section">
                    <div class="overall-progress">
                        <div class="progress-header">
                            <h3>Overall Progress</h3>
                            <span id="overall-percentage">0%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="overall-progress-fill"></div>
                        </div>
                        <div class="progress-text">
                            <span id="current-file">Preparing translation...</span>
                            <span id="files-count">0 / 0 files</span>
                        </div>
                    </div>

                    <div class="current-status">
                        <div class="status-icon" id="status-icon">
                            <div class="spinner"></div>
                        </div>
                        <div class="status-info">
                            <h4 id="status-title">Initializing</h4>
                            <p id="status-message">Setting up translation process</p>
                        </div>
                    </div>
                </div>

                <div class="file-list" id="file-list">
                    <h3>Recent Files</h3>
                    <div class="file-items" id="file-items">
                        <!-- File items will be added here -->
                    </div>
                </div>

                <div class="actions">
                    <button id="cancelBtn" class="btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel Translation
                    </button>
                    <button id="showResultsBtn" class="btn-primary" style="display: none;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                        </svg>
                        Show Results
                    </button>
                </div>

                <div id="completion-message" class="completion-message" style="display: none;">
                    <div class="completion-icon" id="completion-icon">
                        <!-- Icon will be set by JavaScript -->
                    </div>
                    <h3 id="completion-title">Translation Complete</h3>
                    <p id="completion-description">All files have been processed successfully.</p>
                    <div class="completion-stats" id="completion-stats">
                        <!-- Stats will be added here -->
                    </div>
                </div>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
