export interface TranslationConfig {
    sourceLanguage: string;
    targetLanguages: string[];
    fileTypes: string[];
    aiProvider: "openai" | "gemini" | "mistral";
    model?: string;
    batchSize?: number;
    outputDirectory?: string;
    rateLimit?: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
}
export declare class ConfigManager {
    private config;
    private secrets;
    constructor();
    /**
     * Get API key for specified provider
     */
    getApiKey(provider: "openai" | "gemini" | "mistral"): string;
    /**
     * Set API key for specified provider
     */
    setApiKey(provider: "openai" | "gemini" | "mistral", key: string): void;
    /**
     * Reset all API keys
     */
    resetApiKeys(): void;
    /**
     * Get default model
     */
    getDefaultModel(): string;
    /**
     * Get AI provider
     */
    getAiProvider(): "openai" | "gemini" | "mistral";
    /**
     * Get source language
     */
    getSourceLanguage(): string;
    /**
     * Get target languages
     */
    getTargetLanguages(): string[];
    /**
     * Get batch size
     */
    getBatchSize(): number;
    /**
     * Get rate limit settings
     */
    getRateLimit(): {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
    /**
     * Check if workspace config exists
     */
    hasWorkspaceConfig(): Promise<boolean>;
    /**
     * Read workspace configuration
     */
    readWorkspaceConfig(): Promise<TranslationConfig | null>;
    /**
     * Write workspace configuration
     */
    writeWorkspaceConfig(config: TranslationConfig): Promise<void>;
    /**
     * Validate configuration
     */
    validateConfig(config: Partial<TranslationConfig>): string[];
}
//# sourceMappingURL=ConfigManager.d.ts.map