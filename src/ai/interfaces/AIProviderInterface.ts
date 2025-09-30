// AI Provider Interface for Localization Services

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TranslationOptions {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
  systemPrompt?: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
  tokens?: {
    input: number;
    output: number;
  };
  error?: string;
}

export interface AIProviderInterface {
  /**
   * Translate text using the AI provider
   * @param options Translation configuration and text
   * @returns Translated text or error
   */
  translateText(options: TranslationOptions): Promise<TranslationResult>;

  /**
   * Validate the API key for the current provider
   * @param apiKey API key to validate
   * @returns Validation result
   */
  validateApiKey(apiKey: string): Promise<{
    isValid: boolean;
    message?: string;
  }>;

  /**
   * Get available models for the AI provider
   * @returns List of model names
   */
  getAvailableModels(): Promise<string[]>;

  /**
   * Configure the AI provider with specific settings
   * @param config Provider configuration
   */
  configure(config: AIProviderConfig): void;
}

// Example usage for implementation
export abstract class BaseAIProvider implements AIProviderInterface {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.configure(config);
  }

  abstract translateText(
    options: TranslationOptions
  ): Promise<TranslationResult>;
  abstract validateApiKey(
    apiKey: string
  ): Promise<{ isValid: boolean; message?: string }>;
  abstract getAvailableModels(): Promise<string[]>;

  configure(config: AIProviderConfig): void {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || "default",
      baseUrl: config.baseUrl,
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
    };
  }
}
