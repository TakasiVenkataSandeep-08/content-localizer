import * as vscode from "vscode";
export declare class StatusBarManager {
    statusBarItem: vscode.StatusBarItem;
    private isTranslating;
    constructor();
    /**
     * Initialize the status bar
     */
    initialize(): void;
    /**
     * Update status bar for translation start
     */
    startTranslation(): void;
    /**
     * Update status bar for translation completion
     */
    completeTranslation(success: boolean, message?: string): void;
    /**
     * Update status bar with progress information
     */
    updateProgress(current: number, total: number): void;
    /**
     * Get status bar item for subscriptions
     */
    getStatusBarItem(): vscode.StatusBarItem;
    /**
     * Dispose of status bar item
     */
    dispose(): void;
}
//# sourceMappingURL=StatusBarManager.d.ts.map