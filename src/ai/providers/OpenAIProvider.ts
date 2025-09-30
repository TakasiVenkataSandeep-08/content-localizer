import OpenAI from "openai";
import {
  BaseAIProvider,
  AIProviderConfig,
  TranslationOptions,
  TranslationResult,
} from "../interfaces/AIProviderInterface";

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async translateText(options: TranslationOptions): Promise<TranslationResult> {
    try {
      const systemPrompt =
        options.systemPrompt ||
        `You are a professional translator. Translate the following text from ${options.sourceLanguage} to ${options.targetLanguage}.`;

      const response = await this.client.chat.completions.create({
        model: this.config.model || "gpt-3.5-turbo",
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
      const tempClient = new OpenAI({ apiKey });
      await tempClient.models.list();
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
    try {
      const models = await this.client.models.list();
      return models.data
        .filter((model) => model.id.startsWith("gpt"))
        .map((model) => model.id);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      return ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"];
    }
  }
}
