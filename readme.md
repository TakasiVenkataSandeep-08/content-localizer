# Localizer AI - VSCode Extension

[![Version](https://img.shields.io/visual-studio-marketplace/v/takasivenkatasandeep.localizer-ai-vscode)](https://marketplace.visualstudio.com/items?itemName=takasivenkatasandeep.localizer-ai-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/takasivenkatasandeep.localizer-ai-vscode)](https://marketplace.visualstudio.com/items?itemName=takasivenkatasandeep.localizer-ai-vscode)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/takasivenkatasandeep.localizer-ai-vscode)](https://marketplace.visualstudio.com/items?itemName=takasivenkatasandeep.localizer-ai-vscode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌍 AI-Powered Content Localization for VS Code

Transform your content into multiple languages with the power of AI. Localizer AI brings intelligent translation capabilities directly into VS Code, supporting JSON, Markdown, and text files with context-aware translation and formatting preservation.

## ✨ Features

### 🚀 **Multi-AI Provider Support**

- **OpenAI GPT-4** - State-of-the-art language understanding
- **Google Gemini** - Advanced multilingual capabilities
- **MistralAI** - High-performance European AI model

### 📁 **Smart File Processing**

- **JSON Files** - Preserve structure and keys while translating values
- **Markdown** - Maintain formatting, links, and code blocks
- **Text Files** - Clean translation with context awareness
- **YAML/YML** - Handle complex configuration files

### 🎯 **Intelligent Translation**

- **Context-Aware** - Understands file context for accurate translations
- **Format Preservation** - Maintains original formatting and structure
- **Batch Processing** - Translate multiple files efficiently
- **Rate Limiting** - Respects API limits automatically

### 🛠️ **Developer-Friendly**

- **VS Code Integration** - Native extension experience
- **Configuration Wizard** - Easy setup with guided prompts
- **Status Bar Integration** - Real-time progress updates
- **Error Handling** - Clear feedback and recovery options

## 🚀 Quick Start

### 1. Install the Extension

- Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=takasivenkatasandeep.localizer-ai-vscode)
- Or follow our [detailed installation guide](INSTALLATION.md)

### 2. Configure API Keys

Open VS Code settings and add your preferred AI provider API key:

- OpenAI API Key
- Google Gemini API Key
- MistralAI API Key

### 3. Create Configuration

1. Open Command Palette (Ctrl+Shift+P)
2. Run "Localizer AI: Create Translation Configuration"
3. Follow the setup wizard

### 4. Start Translating

- Right-click on files/folders in Explorer
- Select "Translate Files"
- Choose target languages
- Watch the magic happen! ✨

## 📋 Usage Guide

### Creating Translation Configuration

The extension creates a `localizer.config.json` file in your workspace:

```json
{
  "source": "src",
  "destination": "locales",
  "from": "en",
  "locales": ["es", "fr", "de", "ja", "ko"],
  "fileTypes": [".json", ".md", ".txt", ".yaml", ".yml"],
  "aiProvider": "openai",
  "model": "gpt-4"
}
```

### Supported File Types

| File Type      | Description      | Example Use Cases                      |
| -------------- | ---------------- | -------------------------------------- |
| **.json**      | JSON files       | i18n translations, configuration files |
| **.md**        | Markdown files   | Documentation, README files            |
| **.txt**       | Plain text files | Simple text content                    |
| **.yaml/.yml** | YAML files       | Configuration files, data structures   |

### Language Support

The extension supports all major languages through AI providers:

- **European**: Spanish, French, German, Italian, Portuguese, etc.
- **Asian**: Japanese, Korean, Chinese, Hindi, Arabic, etc.
- **Others**: Russian, Turkish, Dutch, Swedish, etc.

## ⚙️ Configuration Options

### Extension Settings

Access via VS Code Settings (Ctrl+,) → Search "Localizer AI":

| Setting                       | Description                 | Default              |
| ----------------------------- | --------------------------- | -------------------- |
| `defaultSourceLanguage`       | Default source language     | `"en"`               |
| `defaultTargetLanguages`      | Default target languages    | `["es", "fr", "de"]` |
| `aiProvider`                  | AI service provider         | `"openai"`           |
| `model`                       | AI model to use             | `"gpt-4"`            |
| `batchSize`                   | Files processed in parallel | `10`                 |
| `rateLimit.requestsPerMinute` | API rate limit              | `60`                 |
| `rateLimit.tokensPerMinute`   | Token rate limit            | `10000`              |

### Advanced Configuration

```json
{
  "localizer-ai": {
    "openai": {
      "apiKey": "your-openai-key",
      "model": "gpt-4-turbo-preview"
    },
    "gemini": {
      "apiKey": "your-gemini-key",
      "model": "gemini-pro"
    },
    "mistral": {
      "apiKey": "your-mistral-key",
      "model": "mistral-large-latest"
    }
  }
}
```

## 🎯 Commands

| Command                              | Description                      | Access                        |
| ------------------------------------ | -------------------------------- | ----------------------------- |
| **Create Translation Configuration** | Set up translation config        | Command Palette               |
| **Translate Files**                  | Translate selected files/folders | Right-click / Command Palette |
| **Open Extension Settings**          | Configure extension settings     | Command Palette               |

## 🖥️ User Interface

### Status Bar

- Shows translation progress
- Displays current AI provider
- Shows rate limit status

### Context Menus

- **Explorer**: Right-click files/folders for translation
- **Command Palette**: All commands available via Ctrl+Shift+P

### Output Panel

- Detailed translation logs
- Error messages and debugging info
- Progress updates

## 🔧 Development

### Prerequisites

- Node.js 16.0.0+
- VS Code Extension Development tools

### Setup

```bash
git clone https://github.com/TakasiVenkataSandeep-08/localizer-ai-vscode.git
cd localizer-ai-vscode
npm install
```

### Development Commands

```bash
# Run extension in development
npm run compile
# Then press F5 in VS Code

# Run tests
npm test

# Lint code
npm run lint

# Package extension
npm run package
```

## 🐛 Troubleshooting

### Common Issues

#### Extension Not Activating

- Ensure you're in a workspace folder
- Check VS Code version (1.74.0+ required)

#### API Key Issues

- Verify API key is correct
- Check account credits/quota
- Ensure proper permissions

#### Translation Failures

- Check internet connection
- Verify file formats are supported
- Review error logs in Output panel

#### Rate Limiting

- Reduce batch size in settings
- Increase rate limits if possible
- Use different AI provider

### Getting Help

1. Check [troubleshooting guide](INSTALLATION.md#troubleshooting)
2. Review logs in Output panel
3. Report issues on [GitHub](https://github.com/TakasiVenkataSandeep-08/localizer-ai-vscode/issues)

## 🔒 Security & Privacy

- **API Keys**: Stored securely in VS Code settings
- **Data Processing**: Files processed locally, sent only to AI providers
- **No Tracking**: No usage analytics or data collection
- **Open Source**: Full transparency with open-source code

## 📈 Performance Tips

- **Batch Size**: Adjust based on your API limits
- **File Selection**: Process smaller batches for better performance
- **Rate Limits**: Configure appropriate limits for your plan
- **Network**: Ensure stable internet connection

## 🔄 Roadmap

### Version 1.1 (Coming Soon)

- [ ] Translation caching for faster re-translations
- [ ] Custom translation prompts
- [ ] Batch translation preview
- [ ] Translation history

### Version 1.2 (Future)

- [ ] Translation quality scoring
- [ ] Custom glossary support
- [ ] Collaborative translation features
- [ ] Integration with translation memory systems

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT models
- **Google** for Gemini models
- **MistralAI** for Mistral models
- **VS Code Team** for the excellent extension platform

## 📞 Support

- **Documentation**: [Full Guide](INSTALLATION.md)
- **Issues**: [GitHub Issues](https://github.com/TakasiVenkataSandeep-08/localizer-ai-vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TakasiVenkataSandeep-08/localizer-ai-vscode/discussions)

---

**Made with ❤️ by [Takasi Venkata Sandeep](https://github.com/TakasiVenkataSandeep-08)**

[⭐ Star this repo](https://github.com/TakasiVenkataSandeep-08/localizer-ai-vscode) if you find it helpful!
