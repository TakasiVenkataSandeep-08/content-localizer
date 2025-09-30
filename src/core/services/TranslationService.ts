import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { ConfigManager, TranslationConfig } from "../config/ConfigManager";
import { ProgressWebview } from "../../vscode/webviews/components/ProgressWebview";
// @ts-ignore - AI modules don't have TypeScript definitions
const { askOpenAI } = require("../../ai/providers/OpenAIProvider");
const { askGeminiAI } = require("../../ai/providers/GeminiAIProvider");
const { askMistralAI } = require("../../ai/providers/MistralAIProvider");
const { systemPrompt } = require("../../constants/prompt");

export interface TranslationResult {
  file: string;
  success: boolean;
  error?: string;
  translatedFiles?: string[];
}

export class TranslationService {
  private configManager: ConfigManager;
  private progressWebview?: ProgressWebview;

  constructor(configManager: ConfigManager, progressWebview?: ProgressWebview) {
    this.configManager = configManager;
    this.progressWebview = progressWebview;
  }

  /**
   * Translate all files in a directory based on configuration
   */
  async translateDirectory(
    targetDir: string,
    config: TranslationConfig,
    progressCallback: (current: number, total: number) => void,
    token: vscode.CancellationToken
  ): Promise<TranslationResult[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error("No workspace folder is open");
    }

    const workspaceRoot = workspaceFolder.uri.fsPath as string;

    const sourcePath = path.join(workspaceRoot, targetDir);
    const results: TranslationResult[] = [];

    try {
      // Get all files matching the configuration
      const files = await this.getFilesToTranslate(sourcePath, config);

      if (files.length === 0) {
        vscode.window.showWarningMessage(
          "No files found matching the specified criteria"
        );
        return results;
      }

      // Process each file
      for (let i = 0; i < files.length; i++) {
        if (token.isCancellationRequested) {
          break;
        }

        const file: string = files[i] || "";
        progressCallback(i + 1, files.length);

        // Update progress webview: processing
        this.progressWebview?.updateProgress({
          current: i + 1,
          total: files.length,
          file: path.relative(workspaceRoot, file),
          status: "processing",
          message: `Translating ${path.basename(file)}`,
        });

        try {
          const result = await this.translateFile(
            file,
            config,
            workspaceRoot as string
          );

          // Update progress webview: completed
          this.progressWebview?.updateProgress({
            current: i + 1,
            total: files.length,
            file: path.relative(workspaceRoot, file),
            status: result.success ? "completed" : "error",
            message: result.success
              ? "Translation completed"
              : result.error || "Translation failed",
          });

          results.push(result);
        } catch (error) {
          // Update progress webview: error
          this.progressWebview?.updateProgress({
            current: i + 1,
            total: files.length,
            file: path.relative(workspaceRoot, file),
            status: "error",
            message: (error as Error).message,
          });

          results.push({
            file: path.relative(workspaceRoot, file),
            success: false,
            error: (error as Error).message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(
        `Failed to translate directory: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get all files to translate based on configuration
   */
  private async getFilesToTranslate(
    sourcePath: string,
    config: TranslationConfig
  ): Promise<string[]> {
    const files: string[] = [];
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
      return files;
    }

    for (const fileType of config.fileTypes) {
      const pattern = path.join(sourcePath, "**", `*${fileType}`);
      const relativePattern = path.relative(
        workspaceFolder.uri.fsPath,
        pattern
      );

      const uris = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, relativePattern)
      );

      files.push(
        ...uris
          .map((uri) => uri.fsPath)
          .filter((path): path is string => path !== undefined)
      );
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Translate a single file
   */
  private async translateFile(
    filePath: string,
    config: TranslationConfig,
    workspaceRoot: string
  ): Promise<TranslationResult> {
    const relativePath = path.relative(workspaceRoot || "", filePath);
    const fileExtension = path.extname(filePath);
    const fileName = path.basename(filePath, fileExtension);

    try {
      // Read source file
      const content = await fs.readFile(filePath, "utf-8");

      // Get AI provider function
      const askAI = this.getAIProvider(config.aiProvider);

      // Process each target language
      const translatedFiles: string[] = [];

      for (const targetLang of config.targetLanguages) {
        // Create output directory structure
        const outputDir = config.outputDirectory || path.dirname(relativePath);
        const langOutputDir = outputDir.replace("{lang}", targetLang);
        const outputPath = path.join(
          workspaceRoot!,
          langOutputDir,
          path.dirname(relativePath),
          `${fileName}.${targetLang}${fileExtension}`
        );

        // Ensure output directory exists
        const outputDirPath = path.dirname(outputPath);
        if (outputDirPath) {
          await fs.mkdir(outputDirPath, { recursive: true });
        }

        // Prepare translation prompt
        const translationPrompt = this.buildTranslationPrompt(
          content,
          config.sourceLanguage,
          targetLang,
          fileExtension,
          relativePath
        );

        // Get translation
        const translatedContent = await askAI({
          question: `Please translate the following content:\n\n${content}`,
          systemPrompt: translationPrompt,
        });

        // Write translated file
        await fs.writeFile(outputPath, translatedContent, "utf-8");
        translatedFiles.push(path.relative(workspaceRoot!, outputPath));
      }

      return {
        file: relativePath,
        success: true,
        translatedFiles,
      };
    } catch (error) {
      return {
        file: relativePath,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get the appropriate AI provider function
   */
  private getAIProvider(provider: string) {
    const apiKey = this.configManager.getApiKey(provider as any);

    if (!apiKey) {
      throw new Error(`No API key configured for ${provider}`);
    }

    switch (provider) {
      case "openai":
        return askOpenAI;
      case "gemini":
        return askGeminiAI;
      case "mistral":
        return askMistralAI;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Build translation prompt based on file type and context
   */
  private buildTranslationPrompt(
    content: string,
    sourceLang: string,
    targetLang: string,
    fileExtension: string,
    filePath: string
  ): string {
    let prompt = (systemPrompt as string)
      .replace(/\$from/g, sourceLang)
      .replace(/\$to/g, targetLang)
      .replace(/\$fileType/g, this.getFileTypeDescription(fileExtension));

    // Add file context if available
    const fileContext = this.extractFileContext(filePath);
    if (fileContext) {
      prompt = prompt.replace(
        /\$context/g,
        `Context:\n"""\n${fileContext}\n"""`
      );
    } else {
      prompt = prompt.replace(/\$context/g, "");
    }

    return prompt;
  }

  /**
   * Get human-readable file type description
   */
  private getFileTypeDescription(extension: string): string {
    const descriptions: Record<string, string> = {
      ".json": "JSON configuration or data file",
      ".md": "Markdown documentation file",
      ".txt": "Plain text file",
      ".js": "JavaScript code file",
      ".ts": "TypeScript code file",
      ".yaml": "YAML configuration file",
      ".yml": "YAML configuration file",
    };

    return descriptions[extension] || `${extension} file`;
  }

  /**
   * Extract file context from path (can be enhanced with more sophisticated logic)
   */
  private extractFileContext(filePath: string): string {
    const segments = filePath.split(path.sep);
    const contextHints: string[] = [];

    // Add context based on directory structure
    if (segments.includes("docs") || segments.includes("documentation")) {
      contextHints.push("Documentation content");
    }
    if (segments.includes("config") || segments.includes("settings")) {
      contextHints.push("Configuration file");
    }
    if (segments.includes("ui") || segments.includes("components")) {
      contextHints.push("User interface content");
    }

    return contextHints.length > 0 ? contextHints.join(", ") : "";
  }
}
