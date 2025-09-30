export class StringUtils {
  /**
   * Truncate a string to a specified length
   * @param str Input string
   * @param length Maximum length
   * @param ellipsis Ellipsis to append if truncated (default: '...')
   * @returns Truncated string
   */
  static truncate(
    str: string,
    length: number,
    ellipsis: string = "..."
  ): string {
    if (str.length <= length) return str;
    return str.slice(0, length).trim() + ellipsis;
  }

  /**
   * Capitalize the first letter of a string
   * @param str Input string
   * @returns Capitalized string
   */
  static capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert string to camelCase
   * @param str Input string
   * @returns camelCased string
   */
  static toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }

  /**
   * Convert string to snake_case
   * @param str Input string
   * @returns snake_cased string
   */
  static toSnakeCase(str: string): string {
    return str
      .replace(/\W+/g, " ")
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join("_");
  }

  /**
   * Convert string to kebab-case
   * @param str Input string
   * @returns kebab-cased string
   */
  static toKebabCase(str: string): string {
    return str
      .replace(/\W+/g, " ")
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join("-");
  }

  /**
   * Remove extra whitespace from a string
   * @param str Input string
   * @returns Trimmed string with normalized whitespace
   */
  static normalizeWhitespace(str: string): string {
    return str.trim().replace(/\s+/g, " ");
  }

  /**
   * Check if a string is a valid email
   * @param email Email to validate
   * @returns Whether the email is valid
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mask sensitive information (e.g., API keys, emails)
   * @param str String to mask
   * @param visibleChars Number of characters to keep visible
   * @returns Masked string
   */
  static mask(str: string, visibleChars: number = 4): string {
    if (str.length <= visibleChars) return str;
    return str.slice(0, visibleChars) + "*".repeat(str.length - visibleChars);
  }

  /**
   * Generate a random string
   * @param length Length of the random string
   * @param charset Character set to use (default: alphanumeric)
   * @returns Random string
   */
  static generateRandomString(
    length: number,
    charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  ): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Count words in a string
   * @param str Input string
   * @returns Number of words
   */
  static countWords(str: string): number {
    return str.trim().split(/\s+/).length;
  }

  /**
   * Check if a string contains only alphabetic characters
   * @param str Input string
   * @returns Whether the string contains only alphabetic characters
   */
  static isAlphabetic(str: string): boolean {
    return /^[a-zA-Z]+$/.test(str);
  }

  /**
   * Check if a string contains only numeric characters
   * @param str Input string
   * @returns Whether the string contains only numeric characters
   */
  static isNumeric(str: string): boolean {
    return /^[0-9]+$/.test(str);
  }

  /**
   * Escape HTML special characters
   * @param str Input string
   * @returns HTML-escaped string
   */
  static escapeHtml(str: string): string {
    const htmlEscapeMap: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return str.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
  }
}
