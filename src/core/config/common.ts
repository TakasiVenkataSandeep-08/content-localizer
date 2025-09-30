const { execSync } = require("child_process");
const path = require("path");

const Configstore = require("configstore");
// eslint-disable-next-line import/no-dynamic-require, global-require
const pkg = require(path.join(__dirname, "../../package.json"));
const configStore = new Configstore(pkg.name);

// Lazy-load prompt-sync so non-interactive environments (e.g. CI) don't break
let promptSync;

/**
 * Retrieve an API key for the given key name.
 * Priority:
 *   1. Environment variable (uppercase, hyphen → underscore)
 *   2. Configstore (persisted per-user)
 *   3. npm config
 *   4. Interactive prompt (stores into Configstore)
 * @param {string} keyName e.g. "openai-key", "gemini-key"
 * @returns {string} API key value
 */
const getApiKey = (keyName = "openai-key") => {
  // 1. ENV variable (OPENAI_KEY etc.)
  const envKey = keyName.toUpperCase().replace(/-/g, "_");
  if (process.env[envKey]) {
    return process.env[envKey];
  }

  // 2. Configstore
  const stored = configStore.get(keyName);
  if (stored) {
    return stored;
  }

  // 3. npm config
  try {
    const npmVal = execSync(`npm config get ${keyName}`, {
      encoding: "utf-8",
    }).trim();
    if (npmVal && npmVal !== "undefined" && npmVal !== "null") {
      return npmVal;
    }
  } catch (_) {
    // ignore; fallback to prompt
  }

  // 4. Interactive prompt (only if STDIN is a TTY)
  if (process.stdin.isTTY) {
    if (!promptSync) {
      // Require only when needed to avoid unnecessary dependency load in CI.
      // eslint-disable-next-line global-require
      promptSync = require("prompt-sync")({ sigint: true });
    }
    const input = promptSync(`Enter your ${keyName}: `).trim();
    if (input) {
      configStore.set(keyName, input);
      return input;
    }
  }

  // If we reach here, we couldn't obtain the key.
  console.error(`\n❌ Error: ${keyName} not found.`);
  console.info(
    "Set it via one of the following methods and retry:\n" +
      `  • env var:   export ${envKey}=YOUR_API_KEY\n` +
      `  • npm rc :   npm config set ${keyName} YOUR_API_KEY -g\n` +
      "  • interactive: run again in a TTY and enter when prompted.",
  );
  process.exit(1);
};

/**
 * Clears all stored API keys from Configstore so the CLI will prompt again.
 */
const resetApiKeys = () => {
  const apiKeys = ["openai-key", "mistralai-key", "gemini-key"];
  apiKeys.forEach((key) => configStore.delete(key));
  console.log(
    "\n✅ API keys have been cleared. You will be prompted for them on next use.\n",
  );
};

module.exports = { getApiKey, resetApiKeys };
