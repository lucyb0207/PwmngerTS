# Cryptographic Design

## Overview

PwmngerTS implements a zero-knowledge password manager using industry-standard cryptographic primitives. All encryption and decryption operations occur client-side, ensuring that the server never has access to plaintext data or master passwords.

## Key Derivation

### Master Key Derivation (Argon2id)

The master password is transformed into a cryptographic seed using Argon2id, a memory-hard key derivation function resistant to brute-force and GPU-based attacks.

**Algorithm**: Argon2id  
**Parameters**:
- **Memory**: 64 MB (65536 KB)
- **Iterations (Time Cost)**: 10
- **Parallelism**: 4 threads
- **Salt**: 128-bit random value (16 bytes)
- **Output**: 256-bit seed (32 bytes)

**Implementation**: Uses `hash-wasm` library for high-performance WASM-based hashing in the browser.

### Key Expansion (HKDF)

To separate authentication from encryption, we expand the Argon2id seed using HKDF (HMAC-based Key Derivation Function).

**Algorithm**: HKDF-SHA256  
**Derived Keys**:
1. **Encryption Key**: Used for wrapping the Vault Key. (Info: `pwmnger-encryption-v1`)
2. **Auth Key**: Used for server authentication. (Info: `pwmnger-auth-v1`)

```typescript
// From packages/crypto/src/kdf.ts
const { encryptionKey, authKey } = await deriveKeysFromPassword(password, salt);
```

## Encryption

### Vault Encryption (AES-256-GCM)

The vault (containing all password entries) is encrypted using AES-256-GCM, which provides both confidentiality and authenticity (AEAD).

**Algorithm**: AES-256-GCM  
**Key Size**: 256 bits (32 bytes)  
**IV**: 96-bit random (12 bytes) - generated per encryption  
**Tag Length**: 128 bits  

### Key Wrapping

The **Vault Key** (a random AES-256 key) is encrypted (wrapped) with the **Encryption Key** derived from the master password.

**Algorithm**: AES-GCM Key Wrap  

## 🛡️ Authentication Flow

1. **Client**: Derives `Auth Key` via KDF + HKDF.
2. **Client**: Hashes the `Auth Key` using SHA-256 (`authHash`).
3. **Server**: Receives `authHash` and verifies it using **Argon2** (server-side hashing).

This "double-hashing" approach ensures that even if the server database is leaked, the attacker only gets an Argon2 hash of a SHA-256 hash, and they still lack the salt and the master password required to derive the encryption keys.

## 🔄 Salt Rotation

Whenever a user changes their master password, PwmngerTS performs a **Salt Rotation**:
1. A new 16-byte random salt is generated.
2. The vault is re-encrypted using the new salt.
3. The new salt is uploaded to the server.

This ensures that even if an attacker has captured a legacy "encrypted blob" and the old salt, they cannot use the new password to unlock the old data, effectively breaking the link between old and new security states.

## 🆘 Account Recovery

The Emergency Recovery Kit uses a high-entropy **Recovery Key** (256-bit) to wrap the Vault Key. This bypasses the master password requirement while maintaining zero-knowledge security, as the Recovery Key is never sent to the server.

## Security Properties

✅ **Confidentiality**: AES-256-GCM ensures data cannot be read without the key.  
✅ **Authenticity**: GCM authentication tag prevents tampering.  
✅ **Zero-Knowledge**: Server never sees plaintext, master keys, or recovery keys.  
✅ **Brute-Force Resistance**: Argon2id (10 iterations, 64MB) provides strong protection.  
✅ **Key Separation**: HKDF ensures the key used for login is mathematically distinct from the key used for encryption.

## References

- [Web Crypto API Specification](https://www.w3.org/TR/WebCryptoAPI/)
- [Argon2 RFC 9106](https://datatracker.ietf.org/doc/html/rfc9106)
- [HKDF RFC 5869](https://datatracker.ietf.org/doc/html/rfc5869)
