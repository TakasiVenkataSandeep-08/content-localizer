import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { FileUtils } from "../../utils/fileUtils";
import { ErrorHandler, ErrorCategory } from "../../utils/errorHandler";
import { Logger } from "../../utils/logger";

export interface ConfigSource {
  type: "file" | "env" | "default";
  priority: number;
}

export interface ConfigOptions {
  configDir?: string;
  fileName?: string;
  sources?: ConfigSource[];
}

export interface TranslationConfig {
  sourceLanguage: string;
  targetLanguages: string[];
  fileTypes: string[];
  aiProvider: "openai" | "gemini" | "mistral";
  batchSize: number;
  source?: string;
  outputDirectory?: string;
  apiKeys?: Record<string, string>;
}

export class ConfigManager {
  private static DEFAULT_CONFIG: TranslationConfig = {
    sourceLanguage: "en",
    targetLanguages: [],
    fileTypes: [".json", ".md", ".txt"],
    aiProvider: "openai",
    batchSize: 10,
  };

  private logger: Logger;
  private configPath: string;
  private configSources: ConfigSource[];

  constructor(options: ConfigOptions = {}) {
    this.logger = Logger.getInstance();

    // Determine config directory
    const configDir =
      options.configDir || path.join(os.homedir(), ".localizer-ai");

    // Ensure config directory exists
    try {
      fs.mkdirSync(configDir, { recursive: true });
    } catch (error) {
      this.logger.error("Failed to create config directory", error);
    }

    // Set config file path
    this.configPath = path.join(configDir, options.fileName || "config.json");

    // Set config sources with default fallback
    this.configSources =
      options.sources ||
      [
        { type: "file", priority: 3 },
        { type: "env", priority: 2 },
        { type: "default", priority: 1 },
      ].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Load configuration from various sources
   */
  public async loadConfig(): Promise<TranslationConfig> {
    for (const source of this.configSources) {
      try {
        switch (source.type) {
          case "file":
            const fileConfig = await this.loadFileConfig();
            if (fileConfig) return fileConfig;
            break;
          case "env":
            const envConfig = this.loadEnvConfig();
            if (envConfig) return envConfig;
            break;
          case "default":
            return { ...ConfigManager.DEFAULT_CONFIG };
        }
      } catch (error) {
        this.logger.warn(`Failed to load config from ${source.type}`, error);
      }
    }

    return { ...ConfigManager.DEFAULT_CONFIG };
  }

  /**
   * Load configuration from file
   */
  private async loadFileConfig(): Promise<TranslationConfig | null> {
    try {
      const configExists = await FileUtils.getFileInfo(this.configPath)
        .then(() => true)
        .catch(() => false);

      if (!configExists) return null;

      const configContent = await FileUtils.readFile(this.configPath);
      const parsedConfig = JSON.parse(configContent);

      // Validate config structure
      this.validateConfig(parsedConfig);

      return parsedConfig;
    } catch (error) {
      ErrorHandler.handle(error, (localizerError) => {
        this.logger.error("Error loading file config", localizerError);
      });
      return null;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvConfig(): TranslationConfig | null {
    const envConfig: Partial<TranslationConfig> = {};

    // Map environment variables to config keys
    const envMapping = {
      LOCALIZER_SOURCE_LANG: "sourceLanguage",
      LOCALIZER_TARGET_LANGS: "targetLanguages",
      LOCALIZER_FILE_TYPES: "fileTypes",
      LOCALIZER_AI_PROVIDER: "aiProvider",
      LOCALIZER_BATCH_SIZE: "batchSize",
      LOCALIZER_SOURCE_DIR: "source",
      LOCALIZER_OUTPUT_DIR: "outputDirectory",
    };

    let hasEnvConfig = false;

    for (const [envKey, configKey] of Object.entries(envMapping)) {
      const value = process.env[envKey];
      if (value) {
        hasEnvConfig = true;

        // Special handling for array-like env vars
        if (configKey === "targetLanguages" || configKey === "fileTypes") {
          envConfig[configKey] = value.split(",").map((v) => v.trim());
        } else if (configKey === "batchSize") {
          envConfig[configKey] = parseInt(value, 10);
        } else {
          envConfig[configKey] = value;
        }
      }
    }

    return hasEnvConfig
      ? ({ ...ConfigManager.DEFAULT_CONFIG, ...envConfig } as TranslationConfig)
      : null;
  }

  /**
   * Save configuration to file
   * @param config Configuration to save
   */
  public async saveConfig(config: TranslationConfig): Promise<void> {
    try {
      // Validate config before saving
      this.validateConfig(config);

      // Merge with default config to ensure all keys are present
      const mergedConfig = {
        ...ConfigManager.DEFAULT_CONFIG,
        ...config,
      };

      await FileUtils.writeFile(
        this.configPath,
        JSON.stringify(mergedConfig, null, 2)
      );

      this.logger.info("Configuration saved successfully");
    } catch (error) {
      ErrorHandler.handle(error, (localizerError) => {
        this.logger.error("Error saving config", localizerError);
      });
    }
  }

  /**
   * Validate configuration object
   * @param config Configuration to validate
   */
  private validateConfig(config: Partial<TranslationConfig>): void {
    const errors: string[] = [];

    // Validate source language
    if (
      config.sourceLanguage &&
      !/^[a-z]{2}(-[A-Z]{2})?$/.test(config.sourceLanguage)
    ) {
      errors.push("Invalid source language code");
    }

    // Validate target languages
    if (config.targetLanguages) {
      const invalidLangs = config.targetLanguages.filter(
        (lang) => !/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)
      );
      if (invalidLangs.length > 0) {
        errors.push(
          `Invalid target language codes: ${invalidLangs.join(", ")}`
        );
      }
    }

    // Validate AI provider
    if (
      config.aiProvider &&
      !["openai", "gemini", "mistral"].includes(config.aiProvider)
    ) {
      errors.push("Invalid AI provider");
    }

    // Validate batch size
    if (config.batchSize && (config.batchSize < 1 || config.batchSize > 50)) {
      errors.push("Batch size must be between 1 and 50");
    }

    // Throw validation error if any exist
    if (errors.length > 0) {
      throw ErrorHandler.createError(
        `Configuration validation failed: ${errors.join("; ")}`,
        { category: ErrorCategory.VALIDATION }
      );
    }
  }

  /**
   * Reset configuration to default
   */
  public async resetConfig(): Promise<void> {
    try {
      await this.saveConfig(ConfigManager.DEFAULT_CONFIG);
      this.logger.info("Configuration reset to default");
    } catch (error) {
      ErrorHandler.handle(error, (localizerError) => {
        this.logger.error("Error resetting config", localizerError);
      });
    }
  }

  /**
   * Get API key for a specific provider
   * @param provider AI provider
   */
  public async getApiKey(
    provider: keyof TranslationConfig["apiKeys"]
  ): Promise<string | undefined> {
    const config = await this.loadConfig();
    return config.apiKeys?.[provider];
  }

  /**
   * Set API key for a specific provider
   * @param provider AI provider
   * @param apiKey API key to set
   */
  public async setApiKey(
    provider: keyof TranslationConfig["apiKeys"],
    apiKey: string
  ): Promise<void> {
    const config = await this.loadConfig();
    config.apiKeys = config.apiKeys || {};
    config.apiKeys[provider] = apiKey;
    await this.saveConfig(config);
  }

  /**
   * Clear all stored API keys
   */
  public async clearApiKeys(): Promise<void> {
    const config = await this.loadConfig();
    delete config.apiKeys;
    await this.saveConfig(config);
    this.logger.info("All API keys cleared");
  }
}
