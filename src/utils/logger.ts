import * as fs from "fs/promises";
import * as path from "path";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LoggerConfig {
  level?: LogLevel;
  logToConsole?: boolean;
  logToFile?: boolean;
  filePath?: string;
  maxFileSize?: number; // in bytes
  maxBackupFiles?: number;
}

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logFilePath: string;

  private constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level || LogLevel.INFO,
      logToConsole: config.logToConsole ?? true,
      logToFile: config.logToFile ?? false,
      filePath: config.filePath || path.join(process.cwd(), "logs", "app.log"),
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB default
      maxBackupFiles: config.maxBackupFiles || 5,
    };

    this.logFilePath = this.config.filePath;
  }

  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });
    } catch (error) {
      console.error("Failed to create log directory:", error);
    }
  }

  private async rotateLogFiles(): Promise<void> {
    try {
      const stats = await fs.stat(this.logFilePath);

      if (stats.size > (this.config.maxFileSize || 0)) {
        // Rotate log files
        for (let i = this.config.maxBackupFiles! - 1; i > 0; i--) {
          const sourceFile =
            i === 1 ? this.logFilePath : `${this.logFilePath}.${i - 1}`;
          const destFile = `${this.logFilePath}.${i}`;

          try {
            await fs.rename(sourceFile, destFile);
          } catch (renameError) {
            // Ignore if file doesn't exist
            if ((renameError as NodeJS.ErrnoException).code !== "ENOENT") {
              console.error("Log rotation error:", renameError);
            }
          }
        }
      }
    } catch (error) {
      // File doesn't exist, no rotation needed
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Log rotation check error:", error);
      }
    }
  }

  private formatLogMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const levelString = LogLevel[level];
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${levelString}] ${message}${contextStr}\n`;
  }

  private async writeToFile(message: string): Promise<void> {
    try {
      await this.ensureLogDirectory();
      await this.rotateLogFiles();
      await fs.appendFile(this.logFilePath, message);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): void {
    // Only log if current level is less than or equal to configured level
    if (level < this.config.level!) return;

    const formattedMessage = this.formatLogMessage(level, message, context);

    // Log to console if enabled
    if (this.config.logToConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage.trim());
          break;
        case LogLevel.INFO:
          console.info(formattedMessage.trim());
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage.trim());
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(formattedMessage.trim());
          break;
      }
    }

    // Log to file if enabled
    if (this.config.logToFile) {
      this.writeToFile(formattedMessage);
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ): void {
    const errorContext =
      error instanceof Error
        ? {
            ...context,
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
          }
        : context;

    this.log(LogLevel.ERROR, message, errorContext);
  }

  public critical(
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ): void {
    const errorContext =
      error instanceof Error
        ? {
            ...context,
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
          }
        : context;

    this.log(LogLevel.CRITICAL, message, errorContext);
  }

  /**
   * Update logger configuration at runtime
   */
  public updateConfig(config: LoggerConfig): void {
    this.config = { ...this.config, ...config };
  }
}
