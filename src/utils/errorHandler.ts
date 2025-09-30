import { Logger, LogLevel } from "./logger";

export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  NETWORK = "NETWORK",
  SYSTEM = "SYSTEM",
  TRANSLATION = "TRANSLATION",
  CONFIGURATION = "CONFIGURATION",
  UNKNOWN = "UNKNOWN",
}

export interface ErrorDetails {
  category: ErrorCategory;
  code?: string;
  isRetryable?: boolean;
  context?: Record<string, any>;
}

export class LocalizerError extends Error {
  public readonly category: ErrorCategory;
  public readonly code?: string;
  public readonly isRetryable: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    details: ErrorDetails = {
      category: ErrorCategory.UNKNOWN,
      isRetryable: false,
    }
  ) {
    super(message);
    this.name = "LocalizerError";
    this.category = details.category;
    this.code = details.code;
    this.isRetryable = details.isRetryable ?? false;
    this.context = details.context;
  }
}

export class ErrorHandler {
  private static logger = Logger.getInstance();

  /**
   * Handle and log errors with different strategies based on error type
   * @param error Error to handle
   * @param customHandler Optional custom error handling function
   */
  public static handle(
    error: unknown,
    customHandler?: (error: LocalizerError) => void
  ): void {
    // Convert to LocalizerError if not already one
    const localizerError =
      error instanceof LocalizerError
        ? error
        : this.convertToLocalizerError(error);

    // Log the error
    this.logError(localizerError);

    // Call custom handler if provided
    if (customHandler) {
      customHandler(localizerError);
    }

    // Default handling based on error category
    switch (localizerError.category) {
      case ErrorCategory.VALIDATION:
        this.handleValidationError(localizerError);
        break;
      case ErrorCategory.AUTHENTICATION:
        this.handleAuthenticationError(localizerError);
        break;
      case ErrorCategory.NETWORK:
        this.handleNetworkError(localizerError);
        break;
      case ErrorCategory.TRANSLATION:
        this.handleTranslationError(localizerError);
        break;
      default:
        this.handleGenericError(localizerError);
    }
  }

  /**
   * Convert various error types to LocalizerError
   * @param error Error to convert
   */
  private static convertToLocalizerError(error: unknown): LocalizerError {
    if (error instanceof LocalizerError) return error;

    if (error instanceof Error) {
      // Network errors
      if (
        (error as any).code === "ECONNREFUSED" ||
        (error as any).code === "ETIMEDOUT"
      ) {
        return new LocalizerError(error.message, {
          category: ErrorCategory.NETWORK,
          isRetryable: true,
          code: (error as any).code,
        });
      }

      // Authentication errors
      if (
        error.message.includes("unauthorized") ||
        error.message.includes("authentication")
      ) {
        return new LocalizerError(error.message, {
          category: ErrorCategory.AUTHENTICATION,
          isRetryable: false,
        });
      }

      // Generic error conversion
      return new LocalizerError(error.message, {
        category: ErrorCategory.UNKNOWN,
        isRetryable: false,
        context: { originalErrorName: error.name },
      });
    }

    // For non-Error objects
    return new LocalizerError(String(error), {
      category: ErrorCategory.UNKNOWN,
      isRetryable: false,
    });
  }

  /**
   * Log error with appropriate log level
   * @param error Error to log
   */
  private static logError(error: LocalizerError): void {
    const logLevel = this.determineLogLevel(error);

    this.logger.log(logLevel, error.message, {
      category: error.category,
      code: error.code,
      isRetryable: error.isRetryable,
      context: error.context,
    });
  }

  /**
   * Determine log level based on error category
   * @param error Error to determine log level for
   */
  private static determineLogLevel(error: LocalizerError): LogLevel {
    switch (error.category) {
      case ErrorCategory.CRITICAL:
        return LogLevel.CRITICAL;
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.NETWORK:
        return LogLevel.ERROR;
      case ErrorCategory.VALIDATION:
        return LogLevel.WARN;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * Handle validation errors
   * @param error Validation error
   */
  private static handleValidationError(error: LocalizerError): void {
    // Potentially show user-friendly validation message
    console.warn(`Validation Error: ${error.message}`);
  }

  /**
   * Handle authentication errors
   * @param error Authentication error
   */
  private static handleAuthenticationError(error: LocalizerError): void {
    // Clear stored credentials, prompt for re-authentication
    console.error(`Authentication Failed: ${error.message}`);
  }

  /**
   * Handle network errors
   * @param error Network error
   */
  private static handleNetworkError(error: LocalizerError): void {
    if (error.isRetryable) {
      // Implement retry logic
      console.warn(`Network Error (Retryable): ${error.message}`);
    } else {
      console.error(`Network Error: ${error.message}`);
    }
  }

  /**
   * Handle translation errors
   * @param error Translation error
   */
  private static handleTranslationError(error: LocalizerError): void {
    // Potentially fallback to alternative translation method
    console.error(`Translation Error: ${error.message}`);
  }

  /**
   * Handle generic errors
   * @param error Generic error
   */
  private static handleGenericError(error: LocalizerError): void {
    console.error(`Unexpected Error: ${error.message}`);
  }

  /**
   * Create a new LocalizerError
   * @param message Error message
   * @param details Error details
   */
  public static createError(
    message: string,
    details: ErrorDetails = {
      category: ErrorCategory.UNKNOWN,
      isRetryable: false,
    }
  ): LocalizerError {
    return new LocalizerError(message, details);
  }
}
