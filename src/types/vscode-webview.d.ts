// Type definitions for VS Code Webview context

declare function acquireVsCodeApi<T = unknown>(): {
  getState(): T;
  setState(newState: T): void;
  postMessage(message: any): void;
};

interface VSCodeWebviewMessage {
  command: string;
  [key: string]: any;
}
