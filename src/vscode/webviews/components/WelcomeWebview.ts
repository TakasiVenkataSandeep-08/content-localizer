import * as vscode from "vscode";

export class WelcomeWebview {
  public static currentPanel: WelcomeWebview | undefined;
  public static readonly viewType = "localizerWelcome";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (WelcomeWebview.currentPanel) {
      WelcomeWebview.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      WelcomeWebview.viewType,
      "Welcome to Localizer AI",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
        ],
      }
    );

    WelcomeWebview.currentPanel = new WelcomeWebview(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "createConfig":
            vscode.commands.executeCommand("localizer-ai.createConfig");
            this._panel.dispose();
            return;
          case "openDocs":
            vscode.env.openExternal(
              vscode.Uri.parse(
                "https://marketplace.visualstudio.com/items?itemName=takasivenkatasandeep.localizer-ai-vscode"
              )
            );
            return;
          case "dismiss":
            this._panel.dispose();
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose(): void {
    WelcomeWebview.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update(): void {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.WebviewPanel["webview"]): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "welcome.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "welcome.js")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Welcome to Localizer AI</title>
        </head>
        <body>
            <div class="welcome-container">
                <!-- Hero Section -->
                <section class="hero">
                    <div class="hero-content">
                        <div class="logo-section">
                            <svg class="hero-logo" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#007ACC"/>
                                <path d="M2 17L12 22L22 17" stroke="#007ACC" stroke-width="2"/>
                                <path d="M2 12L12 17L22 12" stroke="#007ACC" stroke-width="2"/>
                            </svg>
                            <h1 class="hero-title">Welcome to Localizer AI</h1>
                        </div>
                        <p class="hero-subtitle">AI-powered content localization made simple</p>
                        <div class="hero-actions">
                            <button class="btn-primary" onclick="createConfig()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5v14M5 12h14"/>
                                </svg>
                                Create Configuration
                            </button>
                            <button class="btn-secondary" onclick="openDocs()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                                View Documentation
                            </button>
                        </div>
                    </div>
                    <div class="hero-visual">
                        <div class="feature-cards">
                            <div class="feature-card">
                                <div class="feature-icon">🤖</div>
                                <h3>AI Translation</h3>
                                <p>OpenAI, Google Gemini & MistralAI support</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">⚡</div>
                                <h3>Lightning Fast</h3>
                                <p>Parallel processing with smart rate limiting</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">🎯</div>
                                <h3>Format Aware</h3>
                                <p>Preserves Markdown, JSON & text formatting</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Quick Start Guide -->
                <section class="quick-start">
                    <h2>🚀 Quick Start Guide</h2>
                    <div class="steps-grid">
                        <div class="step-card">
                            <div class="step-number">1</div>
                            <h3>Set API Keys</h3>
                            <p>Configure your AI provider API keys in VS Code settings</p>
                            <code>localizer-ai.*.apiKey</code>
                        </div>
                        <div class="step-card">
                            <div class="step-number">2</div>
                            <h3>Create Config</h3>
                            <p>Use the configuration wizard to set up your translation preferences</p>
                            <kbd>Ctrl+Shift+P</kbd> → "Create Translation Configuration"
                        </div>
                        <div class="step-card">
                            <div class="step-number">3</div>
                            <h3>Translate Files</h3>
                            <p>Right-click on files or folders to start translation</p>
                            <kbd>Right-click</kbd> → "Translate Files"
                        </div>
                    </div>
                </section>

                <!-- Features Overview -->
                <section class="features-overview">
                    <h2>✨ Key Features</h2>
                    <div class="features-grid">
                        <div class="feature-item">
                            <div class="feature-icon-large">🌍</div>
                            <h3>Multi-Language Support</h3>
                            <p>Translate to 50+ languages with context-aware AI models</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon-large">📁</div>
                            <h3>Batch Processing</h3>
                            <p>Process entire directories or individual files efficiently</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon-large">🔒</div>
                            <h3>Secure & Private</h3>
                            <p>API keys stored securely, no data sent to external servers</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon-large">🎨</div>
                            <h3>VS Code Native</h3>
                            <p>Seamlessly integrated with your development workflow</p>
                        </div>
                    </div>
                </section>

                <!-- Supported Formats -->
                <section class="supported-formats">
                    <h2>📄 Supported File Formats</h2>
                    <div class="format-badges">
                        <span class="format-badge">JSON</span>
                        <span class="format-badge">Markdown</span>
                        <span class="format-badge">Text</span>
                        <span class="format-badge">JavaScript</span>
                        <span class="format-badge">TypeScript</span>
                        <span class="format-badge">YAML</span>
                        <span class="format-badge">HTML</span>
                    </div>
                    <p class="format-note">More formats coming soon! File format suggestions welcome.</p>
                </section>

                <!-- Footer -->
                <footer class="welcome-footer">
                    <div class="footer-content">
                        <p>Need help? Check our documentation or create an issue on GitHub.</p>
                        <div class="footer-actions">
                            <button class="btn-link" onclick="openDocs()">📖 Documentation</button>
                            <button class="btn-link" onclick="dismiss()">Don't show again</button>
                        </div>
                    </div>
                </footer>
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
