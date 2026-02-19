# PwmngerTS Architecture

PwmngerTS is a zero-knowledge, cross-platform password manager. This document details our technical architecture, security design, and intended data flow.

## 🏗 Monorepo Structure

We use a monorepo approach powered by `pnpm` workspaces to share logic and UI components across platforms.

```mermaid
graph TD
    subgraph Apps
        web[Web App - React]
        extension[Browser Extension - MV3]
        mobile[Mobile App - React Native]
    end

    subgraph Packages
        crypto[@pwmnger/crypto]
        appLogic[@pwmnger/app-logic]
        vault[@pwmnger/vault]
        storage[@pwmnger/storage]
        ui[@pwmnger/ui]
    end

    subgraph Backend
        api[Node.js + Prisma API]
        db[(PostgreSQL)]
    end

    web --> appLogic
    extension --> appLogic
    mobile --> appLogic

    appLogic --> crypto
    appLogic --> vault
    appLogic --> storage
    appLogic --> api

    api --> db
```

## 🔐 Security Model (Zero-Knowledge)

The core principle of PwmngerTS is that the server **never** sees your plaintext passwords or your master password.

### 1. Key Derivation (Argon2id)
When you enter your master password, it is processed locally using the **Argon2id** memory-hard key derivation function.
- **Salt:** A unique, random salt generated per user.
- **Output:** A 256-bit Master Key (MK).

### 2. Encryption (AES-256-GCM)
All vault data is encrypted on the client side using **AES-256-GCM** (Galois/Counter Mode).
- **Authenticated Encryption:** Provides both confidentiality and integrity.
- **Unique IVs:** A fresh Initialization Vector (IV) is generated for every encryption operation.

### 3. Data Flow
1. **Plaintext Entry** -> Encrypted with MK (Client) -> **Encrypted Blob**
2. **Encrypted Blob** -> Sent to API (HTTPS) -> **Stored in Database**
3. **Download** -> API sends Encrypted Blob -> **Decrypted with MK (Client)**

## ☁️ Secure Synchronization

We sync "Encrypted Blobs" to our backend. Even if our database were fully compromised, the attacker would only see opaque, encrypted data that is mathematically impossible to crack without the locally-derived Master Key.

## 🔑 Hardware Security Keys (WebAuthn)

PwmngerTS supports FIDO2/WebAuthn hardware keys (e.g., YubiKey) for multi-factor authentication.

### Flow:
1. **Registration**: Client requests options -> Server generates challenge -> Hardware key signs -> Server verifies and stores public key.
2. **Authentication**: Server sends challenge -> Hardware key signs with private key -> Server verifies signature against stored public key.

> [!NOTE]
> This provides hardware-level protection against phishing and credential theft, ensuring that even if your Master Password is compromised, your vault remains secure.

## 🚀 Technological Stack

- **Frontend:** React 19, Vite, Vanilla CSS.
- **State:** Custom hooks with `LocalStorage` / `Chrome Storage` persistence.
- **Crypto:** Web Crypto API (Browser), `expo-standard-web-crypto` (Mobile).
- **Backend:** Node.js, Express, Prisma ORM.
- **Database:** PostgreSQL.
