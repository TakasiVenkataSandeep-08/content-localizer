import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BaseAIProvider,
  AIProviderConfig,
  TranslationOptions,
  TranslationResult,
} from "../interfaces/AIProviderInterface";

export class GeminiAIProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI;

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async translateText(options: TranslationOptions): Promise<TranslationResult> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model || "gemini-pro",
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 4096,
        },
      });

      const systemPrompt =
        options.systemPrompt ||
        `You are a professional translator. Translate the following text from ${options.sourceLanguage} to ${options.targetLanguage}.`;

      const prompt = `${systemPrompt}\n\nText to translate: ${options.text}`;

      const result = await model.generateContent(prompt);
      const translatedText = result.response.text().trim();

      return {
        translatedText,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
        tokens: {
          input: result.response.usageMetadata?.promptTokenCount || 0,
          output: result.response.usageMetadata?.candidatesTokenCount || 0,
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
      const tempClient = new GoogleGenerativeAI(apiKey);
      const model = tempClient.getGenerativeModel({ model: "gemini-pro" });
      await model.generateContent("Hello, can you confirm this API key works?");
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
    return ["gemini-pro", "gemini-1.5-pro-latest", "gemini-1.5-flash-latest"];
  }
}
