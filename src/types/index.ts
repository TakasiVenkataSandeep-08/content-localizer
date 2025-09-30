// Core Types
export type Nullable<T> = T | null | undefined;

// Utility Types
export type Primitive = string | number | boolean | symbol | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type RecordOf<K extends string | number | symbol, V> = Record<K, V>;

export type Merge<T, U> = {
  [K in keyof (T & U)]: K extends keyof T
    ? K extends keyof U
      ? T[K] | U[K]
      : T[K]
    : K extends keyof U
    ? U[K]
    : never;
};

// Function Types
export type Func<T = any, R = any> = (...args: T[]) => R;
export type AsyncFunc<T = any, R = any> = (...args: T[]) => Promise<R>;

export type Predicate<T> = (value: T) => boolean;
export type Comparator<T> = (a: T, b: T) => number;

// Advanced Utility Types
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  { [K in Keys]-?: Required<Pick<T, K>> }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, never>>;
  }[Keys];

// Error Handling Types
export interface ErrorWithCode extends Error {
  code?: string;
}

export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

// Validation Types
export type Validator<T> = (value: T) => boolean;
export type Transformer<T, U> = (value: T) => U;

// Configuration Types
export interface ConfigurationOptions {
  readonly strict?: boolean;
  readonly defaults?: Record<string, any>;
  readonly validators?: Record<string, Validator<any>>;
}

// Event Types
export type EventHandler<T = any> = (event: T) => void;
export type EventEmitter<T = any> = {
  on(event: string, handler: EventHandler<T>): void;
  off(event: string, handler: EventHandler<T>): void;
  emit(event: string, data: T): void;
};

// Logging Types
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

// Localization Types
export interface LocalizationOptions {
  language: string;
  fallbackLanguage?: string;
  interpolation?: boolean;
  pluralization?: boolean;
}

export type TranslationFunction = (
  key: string,
  params?: Record<string, any>
) => string;

// Retry Types
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: "linear" | "exponential";
  jitter?: boolean;
}

// Caching Types
export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export type CacheStrategy = "lru" | "fifo" | "lifo";

// Pagination Types
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationOptions & {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Serialization Types
export type Serializable =
  | Primitive
  | Serializable[]
  | { [key: string]: Serializable };

export interface Serializer<T> {
  serialize(data: T): string;
  deserialize(data: string): T;
}

// Dependency Injection Types
export type ServiceIdentifier = string | symbol;
export type ServiceFactory<T> = () => T;

export interface Container {
  register<T>(identifier: ServiceIdentifier, factory: ServiceFactory<T>): void;
  resolve<T>(identifier: ServiceIdentifier): T;
}

// Export all types for easy importing
export * from "./vscode-webview";
