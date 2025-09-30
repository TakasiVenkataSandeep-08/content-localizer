import * as fs from "fs/promises";
import * as path from "path";

export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
}

export class FileUtils {
  /**
   * Read file contents
   * @param filePath Path to the file
   * @param encoding File encoding (default: utf-8)
   * @returns File contents as string
   */
  static async readFile(
    filePath: string,
    encoding: BufferEncoding = "utf-8"
  ): Promise<string> {
    try {
      return await fs.readFile(filePath, { encoding });
    } catch (error) {
      throw new Error(
        `Failed to read file ${filePath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Write file contents
   * @param filePath Path to the file
   * @param content File contents
   * @param encoding File encoding (default: utf-8)
   */
  static async writeFile(
    filePath: string,
    content: string,
    encoding: BufferEncoding = "utf-8"
  ): Promise<void> {
    try {
      await fs.writeFile(filePath, content, { encoding });
    } catch (error) {
      throw new Error(
        `Failed to write file ${filePath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get file information
   * @param filePath Path to the file
   * @returns File information
   */
  static async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath),
        size: stats.size,
        lastModified: stats.mtime,
      };
    } catch (error) {
      throw new Error(
        `Failed to get file info for ${filePath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Find files recursively with optional filters
   * @param directory Root directory to search
   * @param options Optional filters and search options
   * @returns Array of file paths
   */
  static async findFiles(
    directory: string,
    options: {
      extensions?: string[];
      maxDepth?: number;
      ignorePatterns?: RegExp[];
    } = {}
  ): Promise<string[]> {
    const {
      extensions = [],
      maxDepth = Infinity,
      ignorePatterns = [],
    } = options;

    const results: string[] = [];

    async function traverseDirectory(currentPath: string, depth: number) {
      if (depth > maxDepth) return;

      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Skip ignored patterns
        if (ignorePatterns.some((pattern) => pattern.test(fullPath))) continue;

        if (entry.isDirectory()) {
          await traverseDirectory(fullPath, depth + 1);
        } else if (entry.isFile()) {
          // Filter by extensions if provided
          if (
            extensions.length === 0 ||
            extensions.includes(path.extname(fullPath))
          ) {
            results.push(fullPath);
          }
        }
      }
    }

    await traverseDirectory(directory, 0);
    return results;
  }

  /**
   * Create directory if it doesn't exist
   * @param dirPath Directory path
   * @param recursive Create parent directories if they don't exist (default: true)
   */
  static async ensureDirectory(
    dirPath: string,
    recursive = true
  ): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive });
    } catch (error) {
      // Ignore error if directory already exists
      if (
        !(
          error instanceof Error &&
          (error as NodeJS.ErrnoException).code === "EEXIST"
        )
      ) {
        throw error;
      }
    }
  }

  /**
   * Copy file
   * @param sourcePath Source file path
   * @param destinationPath Destination file path
   */
  static async copyFile(
    sourcePath: string,
    destinationPath: string
  ): Promise<void> {
    try {
      await fs.copyFile(sourcePath, destinationPath);
    } catch (error) {
      throw new Error(
        `Failed to copy file from ${sourcePath} to ${destinationPath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
