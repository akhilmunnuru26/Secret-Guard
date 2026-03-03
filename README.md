# 🛡️ SecretGuard

> **Detects hardcoded API keys, passwords and secrets in your code in real time — before you accidentally commit them.**

![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visualstudiocode)
![Version](https://img.shields.io/badge/version-0.0.1-green)
![License](https://img.shields.io/badge/license-MIT-brightgreen)
![Publisher](https://img.shields.io/badge/publisher-AkhilMunnuru-orange)

---

## 🚨 The Problem

Every day, thousands of developers accidentally push API keys, database passwords, and secret tokens to GitHub. SecretGuard solves this by scanning your code **in real time inside VS Code** and flagging secrets before they ever reach a commit.

---

## ✨ Features

- 🔴 **Real-time detection** — Scans as you type, no manual action needed
- 🔍 **Red squiggly underlines** — Just like ESLint, highlights secrets inline
- 📋 **Sidebar panel** — Lists all secrets found across every file in your workspace
- 🎯 **Click to jump** — Click any secret in the sidebar to jump directly to that line
- 🧠 **Smart detection** — Detects secrets by variable name AND by value pattern
- 🛡️ **Status bar indicator** — Shows SecretGuard is actively protecting you
- ⚙️ **Configurable settings** — Toggle specific detections on/off

---

## 🔎 What It Detects

### Name-based Detection
Catches secrets when common keywords are used as variable names:

```javascript
const API_KEY = "sk-abcdefghijklmnop123456"        // ⚠️ Generic API Key
const db_password = "mySecretDbPass123"             // ⚠️ Database Password
const secret_key = "myTopSecretKey123"              // ⚠️ Secret Key
```

### Value-based Detection
Catches secrets even with **custom or random variable names**:

```javascript
const My_Custom_Var = "sk-abcdefghijklmnop123456789012345678"   // ⚠️ OpenAI API Key
const xyz = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8"            // ⚠️ High Entropy String
const token = "AKIAIOSFODNN7EXAMPLE123"                         // ⚠️ AWS Access Key
```

### Full List of Supported Secret Types

| Secret Type | Example Pattern |
|---|---|
| AWS Access Key | `AKIA[0-9A-Z]{16}` |
| Generic API Key | `api_key = "..."` |
| JWT Token | `eyJ...` |
| Private Key | `-----BEGIN RSA PRIVATE KEY-----` |
| Database Password | `db_password = "..."` |
| Secret Key | `secret_key = "..."` |
| OpenAI API Key | `sk-...` |
| GitHub Token | `ghp_...` |
| Stripe Secret Key | `sk_live_...` |
| Stripe Publishable Key | `pk_live_...` |
| Slack Token | `xox[baprs]-...` |
| Google API Key | `AIza...` |
| Twilio API Key | `SK...` |
| High Entropy String | Any random 32+ char string |

---

## 🖥️ How It Works

### 1. Real-time Squiggly Lines
SecretGuard uses the VS Code **Diagnostics API** (same as ESLint) to show red underlines on detected secrets:

![Squiggly lines demo](https://via.placeholder.com/600x200?text=Red+squiggly+lines+on+secrets)

### 2. Sidebar Panel
Open the **SecretGuard panel** in the Explorer sidebar to see all secrets grouped by file:

```
SECRETGUARD
└── 📄 config.js
    ├── ⚠️ AWS Access Key          Line 2
    ├── ⚠️ Generic API Key         Line 5
    └── ⚠️ OpenAI API Key          Line 8
└── 📄 db.js
    └── ⚠️ Database Password       Line 3
```

### 3. Click to Jump
Click any item in the sidebar and VS Code jumps directly to that line in the file.

---

## 🚀 Getting Started

### Install from VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for **SecretGuard**
4. Click **Install**

### Install from VSIX (Manual)
```bash
code --install-extension secretguard-0.0.1.vsix
```

---

## ⚙️ Configuration

Customize SecretGuard from VS Code Settings (`Ctrl+,`):

| Setting | Default | Description |
|---|---|---|
| `secretguard.enableAWSDetection` | `true` | Detect AWS Access Keys |
| `secretguard.enableJWTDetection` | `true` | Detect JWT Tokens |
| `secretguard.enableAPIKeyDetection` | `true` | Detect Generic API Keys |

---

## 🛠️ Commands

| Command | Description |
|---|---|
| `SecretGuard: Scan File for Secrets` | Manually trigger a scan on the active file |

Access via `Ctrl+Shift+P` → type **SecretGuard**

---

## 🏗️ Tech Stack

- **TypeScript** — Strongly typed extension logic
- **VS Code Diagnostics API** — Powers the red squiggly underlines
- **VS Code TreeDataProvider API** — Powers the sidebar panel
- **VS Code Workspace Events API** — Real-time file change detection
- **Regex Pattern Matching** — Core secret detection engine

---

## 🧑‍💻 Local Development

```bash
# Clone the repository
git clone https://github.com/AkhilMunnuru/secretguard.git
cd secretguard

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Press F5 in VS Code to launch Extension Development Host
```

---

## 🤝 Contributing

Contributions are welcome! If you know of a secret pattern that SecretGuard misses, open a PR to add it to the `SECRET_PATTERNS` array in `src/extension.ts`.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-pattern`)
3. Commit your changes (`git commit -m 'Add new secret pattern'`)
4. Push to the branch (`git push origin feature/new-pattern`)
5. Open a Pull Request

---

## 📋 Roadmap

- [ ] Quick Fix — auto replace secret with `process.env.VARIABLE_NAME`
- [ ] Git commit blocker — prevent commits if secrets are detected
- [ ] Workspace-wide scan on startup
- [ ] Export secrets report as JSON
- [ ] Custom pattern support via settings

---
## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.


---

## 👨‍💻 Author

**Akhil Munnuru**
- GitHub: [@AkhilMunnuru](https://github.com/AkhilMunnuru)
- VS Code Marketplace: [SecretGuard](https://marketplace.visualstudio.com/items?itemName=AkhilMunnuru.secretguard)

---

## ⭐ Support

If SecretGuard saved you from a security breach, consider giving it a ⭐ on GitHub and a review on the VS Code Marketplace!

---

*Built with ❤️ to keep developer secrets safe.*
