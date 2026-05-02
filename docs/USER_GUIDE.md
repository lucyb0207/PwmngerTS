# User Guide

Welcome to **PwmngerTS**, a Zero-Knowledge Password Manager designed for privacy and security.

## 🚀 Getting Started

### 1. Account Creation

- Visit the Vault URL (e.g., `http://localhost:3000`).
- Click **"Register"** or **"Create new Vault"**.
- **IMPORTANT**: Your **Master Password** is the only key to your data. Since we are a Zero-Knowledge service, we cannot reset it for you if you lose it.

### 2. Safeguarding Your Vault

- **Recovery Kit**: Immediately after creating your account, go to the Dashboard and click **"Generate Recovery Kit"**. This kit contains a unique key that can unlock your vault without your master password. Store this file securely (e.g., printed in a safe).
- **Two-Factor Authentication (2FA)**: Go to **Security Settings** and enable 2FA using an app like Google Authenticator. Once enabled, you will be prompted for your 6-digit code every time you log in.
- **Passkeys (WebAuthn)**: Link a physical security key (like a YubiKey) for hardware-level multi-factor protection.

## 🧩 Browser Extension

The PwmngerTS Extension allows you to access your vault directly from your browser toolbar.

1. **Setup**: Click the extension icon and enter your Vault URL.
2. **Unlock**: Use your Master Password to access your credentials while browsing.
3. **Cloud Sync**: Your extension stays in sync with your web vault automatically.

## 📂 Managing Your Passwords

- **Folders**: Organize entries into categories like "Work", "Personal", or "Finance".
- **Importing Data**: You can import passwords from other managers using the **JSON Import** feature in Settings. Use our standard JSON format to migrate your data in bulk.
- **Master Password Change**: You can update your master password at any time. The system will automatically rotate your security salt and re-encrypt your entire vault with the new key.

## 🆘 Recovery Flow

If you forget your Master Password, follow these steps:
1. Go to the **Login Page**.
2. Click **"Use Recovery Kit"**.
3. Upload or paste your Recovery Kit.
4. The system will decrypt your vault locally and allow you to set a **New Master Password**.
5. Once updated, your vault will be re-synced to the cloud, and your access will be fully restored.

## 🛡️ Security Guarantees

- **Client-Side Encryption**: Your data is encrypted *before* it leaves your browser.
- **Argon2id Hashing**: We use the strongest available key derivation to protect against brute-force attacks.
- **HKDF Key Separation**: The key used to log in is mathematically distinct from the key used to encrypt your data.
