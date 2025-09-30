import * as vscode from "vscode";
import { ConfigManager, TranslationConfig } from "../utils/ConfigManager";
export interface TranslationResult {
    file: string;
    success: boolean;
    error?: string;
    translatedFiles?: string[];
}
export declare class TranslationService {
    private configManager;
    constructor(configManager: ConfigManager);
    /**
     * Translate all files in a directory based on configuration
     */
    translateDirectory(targetDir: string, config: TranslationConfig, progressCallback: (current: number, total: number) => void, token: vscode.CancellationToken): Promise<TranslationResult[]>;
    /**
     * Get all files to translate based on configuration
     */
    private getFilesToTranslate;
    /**
     * Translate a single file
     */
    private translateFile;
    /**
     * Get the appropriate AI provider function
     */
    private getAIProvider;
    /**
     * Build translation prompt based on file type and context
     */
    private buildTranslationPrompt;
    /**
     * Get human-readable file type description
     */
    private getFileTypeDescription;
    /**
     * Extract file context from path (can be enhanced with more sophisticated logic)
     */
    private extractFileContext;
}
//# sourceMappingURL=TranslationService.d.ts.map