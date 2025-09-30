import * as vscode from "vscode";
import { ConfigManager, TranslationConfig } from "../utils/ConfigManager";

export class ConfigWizardWebview {
  public static currentPanel: ConfigWizardWebview | undefined;
  public static readonly viewType = "localizerConfigWizard";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _configManager: ConfigManager;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    configManager: ConfigManager
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ConfigWizardWebview.currentPanel) {
      ConfigWizardWebview.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ConfigWizardWebview.viewType,
      "Localizer AI - Configuration",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
        ],
      }
    );

    ConfigWizardWebview.currentPanel = new ConfigWizardWebview(
      panel,
      extensionUri,
      configManager
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    configManager: ConfigManager
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._configManager = configManager;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "saveConfig":
            await this._saveConfiguration(message.config);
            return;
          case "loadExistingConfig":
            await this._loadExistingConfiguration();
            return;
          case "validateApiKey":
            await this._validateApiKey(message.provider, message.apiKey);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose(): void {
    ConfigWizardWebview.currentPanel = undefined;

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
    this._panel.title = "Localizer AI - Configuration";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private async _saveConfiguration(config: any): Promise<void> {
    try {
      // Validate configuration
      const errors = this._configManager.validateConfig(config);
      if (errors.length > 0) {
        this._panel.webview.postMessage({
          command: "validationError",
          errors: errors,
        });
        return;
      }

      // Save API keys if provided
      if (config.apiKeys) {
        Object.entries(config.apiKeys).forEach(([provider, key]) => {
          if (key) {
            this._configManager.setApiKey(provider, key as string);
          }
        });
      }

      // Remove API keys from config before saving
      const { apiKeys, ...configToSave } = config;

      // Save configuration
      await this._configManager.writeWorkspaceConfig(configToSave);

      this._panel.webview.postMessage({
        command: "configSaved",
        message: "Configuration saved successfully!",
      });

      // Close panel after short delay
      setTimeout(() => {
        this._panel.dispose();
      }, 2000);
    } catch (error) {
      this._panel.webview.postMessage({
        command: "error",
        message: `Failed to save configuration: ${(error as Error).message}`,
      });
    }
  }

  private async _loadExistingConfiguration(): Promise<void> {
    try {
      const config = await this._configManager.readWorkspaceConfig();
      if (config) {
        this._panel.webview.postMessage({
          command: "loadConfig",
          config: config,
        });
      }
    } catch (error) {
      this._panel.webview.postMessage({
        command: "error",
        message: `Failed to load configuration: ${(error as Error).message}`,
      });
    }
  }

  private async _validateApiKey(
    provider: string,
    apiKey: string
  ): Promise<void> {
    try {
      // Basic validation - check if key is provided and has reasonable length
      const isValid = apiKey && apiKey.trim().length > 10;

      this._panel.webview.postMessage({
        command: "apiKeyValidation",
        provider: provider,
        isValid: isValid,
        message: isValid
          ? "API key format looks valid"
          : "API key appears to be invalid",
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: "apiKeyValidation",
        provider: provider,
        isValid: false,
        message: "Failed to validate API key",
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "configWizard.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "configWizard.js")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Localizer AI Configuration</title>
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
                    <p>Configure your translation settings</p>
                </header>

                <div class="progress-bar">
                    <div class="progress-step active" data-step="1">
                        <span class="step-number">1</span>
                        <span class="step-label">Project Setup</span>
                    </div>
                    <div class="progress-step" data-step="2">
                        <span class="step-number">2</span>
                        <span class="step-label">File Types</span>
                    </div>
                    <div class="progress-step" data-step="3">
                        <span class="step-number">3</span>
                        <span class="step-label">Languages</span>
                    </div>
                    <div class="progress-step" data-step="4">
                        <span class="step-number">4</span>
                        <span class="step-label">AI Provider</span>
                    </div>
                </div>

                <form id="configForm" class="config-form">
                    <!-- Step 1: Project Setup -->
                    <div class="step active" data-step="1">
                        <h2>Project Setup</h2>
                        <div class="form-group">
                            <label for="sourceDir">Source Directory</label>
                            <input type="text" id="sourceDir" placeholder="src, docs, locales..." required>
                            <small>Relative path to the directory containing files to translate</small>
                        </div>

                        <div class="form-group">
                            <label for="outputDir">Output Directory (Optional)</label>
                            <input type="text" id="outputDir" placeholder="localized, translations...">
                            <small>Leave empty to use source directory structure</small>
                        </div>

                        <div class="form-group">
                            <label for="sourceLanguage">Source Language</label>
                            <select id="sourceLanguage" required>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                                <option value="zh">Chinese</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                            </select>
                        </div>
                    </div>

                    <!-- Step 2: File Types -->
                    <div class="step" data-step="2">
                        <h2>File Types to Translate</h2>
                        <div class="checkbox-grid">
                            <label class="checkbox-item">
                                <input type="checkbox" value=".json" checked>
                                <span class="checkmark"></span>
                                JSON Files (.json)
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" value=".md" checked>
                                <span class="checkmark"></span>
                                Markdown (.md)
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" value=".txt">
                                <span class="checkmark"></span>
                                Text Files (.txt)
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" value=".js">
                                <span class="checkmark"></span>
                                JavaScript (.js)
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" value=".ts">
                                <span class="checkmark"></span>
                                TypeScript (.ts)
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" value=".yaml">
                                <span class="checkmark"></span>
                                YAML (.yaml/.yml)
                            </label>
                        </div>
                        <small>Select the file types you want to translate</small>
                    </div>

                    <!-- Step 3: Target Languages -->
                    <div class="step" data-step="3">
                        <h2>Target Languages</h2>
                        <div class="language-selector">
                            <div class="language-input">
                                <input type="text" id="languageInput" placeholder="Type language codes (e.g., es, fr, de)">
                                <button type="button" id="addLanguage" class="btn-secondary">Add</button>
                            </div>
                            <div id="languageTags" class="language-tags">
                                <!-- Language tags will be added here -->
                            </div>
                        </div>
                        <div class="popular-languages">
                            <small>Popular languages:</small>
                            <div class="language-buttons">
                                <button type="button" class="lang-btn" data-lang="es">Spanish</button>
                                <button type="button" class="lang-btn" data-lang="fr">French</button>
                                <button type="button" class="lang-btn" data-lang="de">German</button>
                                <button type="button" class="lang-btn" data-lang="it">Italian</button>
                                <button type="button" class="lang-btn" data-lang="pt">Portuguese</button>
                                <button type="button" class="lang-btn" data-lang="zh">Chinese</button>
                                <button type="button" class="lang-btn" data-lang="ja">Japanese</button>
                                <button type="button" class="lang-btn" data-lang="ko">Korean</button>
                            </div>
                        </div>
                    </div>

                    <!-- Step 4: AI Provider -->
                    <div class="step" data-step="4">
                        <h2>AI Provider Setup</h2>

                        <div class="provider-selection">
                            <div class="provider-option" data-provider="openai">
                                <input type="radio" id="openai" name="provider" value="openai" checked>
                                <label for="openai">
                                    <div class="provider-info">
                                        <strong>OpenAI</strong>
                                        <small>GPT-4, GPT-3.5-turbo</small>
                                    </div>
                                </label>
                            </div>

                            <div class="provider-option" data-provider="gemini">
                                <input type="radio" id="gemini" name="provider" value="gemini">
                                <label for="gemini">
                                    <div class="provider-info">
                                        <strong>Google Gemini</strong>
                                        <small>Gemini Pro, Gemini Flash</small>
                                    </div>
                                </label>
                            </div>

                            <div class="provider-option" data-provider="mistral">
                                <input type="radio" id="mistral" name="provider" value="mistral">
                                <label for="mistral">
                                    <div class="provider-info">
                                        <strong>MistralAI</strong>
                                        <small>Mistral Nemo, Mixtral</small>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="api-key-section">
                            <div class="form-group">
                                <label for="apiKey">API Key</label>
                                <div class="api-key-input">
                                    <input type="password" id="apiKey" placeholder="Enter your API key" required>
                                    <button type="button" id="validateKey" class="btn-secondary">Validate</button>
                                </div>
                                <small id="keyStatus">API key will be stored securely</small>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="batchSize">Batch Size</label>
                            <input type="number" id="batchSize" min="1" max="50" value="10">
                            <small>Number of files to process simultaneously (1-50)</small>
                        </div>
                    </div>
                </form>

                <div class="actions">
                    <button id="prevBtn" class="btn-secondary" disabled>Previous</button>
                    <button id="nextBtn" class="btn-primary">Next</button>
                    <button id="saveBtn" class="btn-primary" style="display: none;">Save Configuration</button>
                </div>

                <div id="message" class="message" style="display: none;"></div>
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
