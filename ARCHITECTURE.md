# PwmngerTS Architecture

PwmngerTS is a zero-knowledge, cross-platform password manager. This document details our technical architecture, security design, and intended data flow.

## 🏗 Monorepo Structure

We use a monorepo approach powered by `pnpm` workspaces to share core cryptographic logic and UI components across the web vault and browser extension.

```mermaid
graph TD
    subgraph Apps
        vault[Unified Vault - Next.js]
        extension[Browser Extension - MV3]
    end

    subgraph Packages
        crypto[@pwmnger/crypto]
        appLogic[@pwmnger/app-logic]
        vaultPkg[@pwmnger/vault]
        storage[@pwmnger/storage]
        ui[@pwmnger/ui]
    end

    subgraph Backend
        api[Next.js API Routes]
        db[(PostgreSQL)]
    end

    vault --> appLogic
    extension --> appLogic

    appLogic --> crypto
    appLogic --> vaultPkg
    appLogic --> storage
    appLogic --> api

    api --> db
```

## 🔐 Security Model (Zero-Knowledge)

The core principle of PwmngerTS is that the server **never** sees your plaintext passwords or your master password.

### 1. Key Derivation (Argon2id + HKDF)
When you enter your master password, it is processed locally:
- **Salt:** A unique, random salt fetched from the server.
- **KDF:** Argon2id (m=64MB, t=10, p=4) produces a master seed.
- **Expansion:** HKDF (SHA-256) derives two separate keys:
    - **Encryption Key:** Used to wrap/unwrap the vault key.
    - **Auth Key:** Hashed (SHA-256) and sent to the server for authentication.

### 2. Encryption (AES-256-GCM)
All vault data is encrypted on the client side using **AES-256-GCM**.
- **Authenticated Encryption:** Provides both confidentiality and integrity.
- **Unique IVs:** A fresh 96-bit Initialization Vector (IV) is generated for every encryption.

### 3. Salt Rotation
To enhance security, the **KDF Salt is rotated** whenever the master password is changed. This ensures that the derived security keys are refreshed completely, mitigating potential legacy compromises.

## ☁️ Secure Synchronization

We sync "Encrypted Blobs" to our backend via Next.js API routes. Even if our database were fully compromised, the attacker would only see opaque, encrypted data that is mathematically impossible to crack without the locally-derived Master Key.

## 🔑 Multi-Factor Authentication

PwmngerTS enforces MFA at the API level:
- **TOTP (2FA)**: Standard time-based codes (e.g., Google Authenticator).
- **WebAuthn (Passkeys)**: Support for hardware security keys (YubiKey) or biometric unlock.

## 🚀 Technological Stack

- **Framework:** Next.js 15 (App Router).
- **Languages:** TypeScript.
- **State:** React Context + Custom Hooks.
- **Crypto:** Web Crypto API + `hash-wasm` (Argon2id).
- **ORM:** Prisma.
- **Database:** PostgreSQL.
