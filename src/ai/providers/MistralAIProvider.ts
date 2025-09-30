import MistralClient from "@mistralai/mistralai";
import {
  BaseAIProvider,
  AIProviderConfig,
  TranslationOptions,
  TranslationResult,
} from "../interfaces/AIProviderInterface";

export class MistralAIProvider extends BaseAIProvider {
  private client: MistralClient;

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new MistralClient(config.apiKey);
  }

  async translateText(options: TranslationOptions): Promise<TranslationResult> {
    try {
      const systemPrompt =
        options.systemPrompt ||
        `You are a professional translator. Translate the following text from ${options.sourceLanguage} to ${options.targetLanguage}.`;

      const response = await this.client.chat({
        model: this.config.model || "open-mistral-nemo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: options.text },
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 4096,
      });

      const translatedText = response.choices[0].message.content?.trim() || "";

      return {
        translatedText,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      return {
        translatedText: "",
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
        error:
          error instanceof Error ? error.message : "Unknown translation error",
      };
    }
  }

  async validateApiKey(
    apiKey: string
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      const tempClient = new MistralClient(apiKey);
      await tempClient.chat({
        model: "open-mistral-nemo",
        messages: [
          {
            role: "user",
            content: "Hello, can you confirm this API key works?",
          },
        ],
      });
      return { isValid: true, message: "API key is valid" };
    } catch (error) {
      return {
        isValid: false,
        message:
          error instanceof Error ? error.message : "API key validation failed",
      };
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      "open-mistral-nemo",
      "open-mixtral-8x7b",
      "mistral-small-latest",
      "mistral-medium-latest",
      "mistral-large-latest",
    ];
  }
}
