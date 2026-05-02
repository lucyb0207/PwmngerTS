import { describe, test, expect, beforeAll, beforeEach, vi } from "vitest";
import { encryptData } from "../../crypto/src/encrypt";
import { decryptData } from "../../crypto/src/decrypt";
import { deriveKeysFromPassword } from "../../crypto/src/kdf";
import { createEmptyVault } from "./vault";
import type { VaultEntry, Vault } from "./types";

describe("Integration Tests (Crypto + Vault)", () => {
  let encryptionKey: CryptoKey;
  let vault: Vault;
  const password = "MasterPassword123!";
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  beforeAll(async () => {
    // Increase timeout for argon2 operations
    vi.setConfig({ testTimeout: 30000 });
    const keys = await deriveKeysFromPassword(password, salt);
    encryptionKey = keys.encryptionKey;
  }, 30000);

  beforeEach(() => {
    vault = createEmptyVault();
  });

  test("Test 1 & 2: Encrypt Vault Data", async () => {
    vault.entries.push({
      id: "bank-1",
      site: "bank.example.com",
      username: "user@example.com",
      password: "SecurePin1234!",
      lastModified: Date.now(),
    });

    const encryptedVault = await encryptData(encryptionKey, vault);
    expect(encryptedVault.iv).toBeDefined();
    expect(encryptedVault.data).toBeDefined();
    expect(encryptedVault.version).toBe(1);

    const decryptedVault = (await decryptData(encryptionKey, {
      iv: Array.from(new Uint8Array(encryptedVault.iv)),
      data: Array.from(new Uint8Array(encryptedVault.data)),
      version: encryptedVault.version,
    })) as Vault;

    expect(decryptedVault.entries.length).toBe(1);
    expect(decryptedVault.entries[0]!.site).toBe("bank.example.com");
  });

  test("Test 6: Access Control - Wrong Password", async () => {
    const encryptedVault = await encryptData(encryptionKey, vault);
    const wrongPassword = "WrongPassword123!";
    const wrongKey = (await deriveKeysFromPassword(wrongPassword, salt))
      .encryptionKey;

    await expect(
      decryptData(wrongKey, {
        iv: Array.from(new Uint8Array(encryptedVault.iv)),
        data: Array.from(new Uint8Array(encryptedVault.data)),
        version: encryptedVault.version,
      }),
    ).rejects.toThrow();
  }, 30000);

  test("Test 7: Large Dataset Processing", async () => {
    const largeVault = createEmptyVault();
    for (let i = 0; i < 50; i++) {
      largeVault.entries.push({
        id: `entry-${i}`,
        site: `site-${i}.com`,
        username: `user-${i}`,
        password: `pass-${i}`,
        lastModified: Date.now(),
      });
    }

    const encrypted = await encryptData(encryptionKey, largeVault);
    const decrypted = (await decryptData(encryptionKey, {
      iv: Array.from(new Uint8Array(encrypted.iv)),
      data: Array.from(new Uint8Array(encrypted.data)),
      version: encrypted.version,
    })) as Vault;

    expect(decrypted.entries.length).toBe(50);
  });

  test("Folder Lifecycle & Metadata Integrity", async () => {
    // 1. Setup vault with folder and entry
    const folderId = "folder-1";
    vault.folders = [{ id: folderId, name: "Finance" }];
    vault.entries.push({
      id: "entry-finance",
      site: "bank.com",
      username: "user",
      password: "pass",
      folderId: folderId,
      lastModified: Date.now()
    });
    vault.updatedAt = Date.now();

    // 2. Encrypt and Decrypt
    const encrypted = await encryptData(encryptionKey, vault);
    const decrypted = (await decryptData(encryptionKey, {
      iv: Array.from(new Uint8Array(encrypted.iv)),
      data: Array.from(new Uint8Array(encrypted.data)),
      version: encrypted.version,
    })) as Vault;

    // 3. Verify Integrity
    const folders = decrypted.folders;
    expect(folders).toBeDefined();
    if (folders && folders.length > 0) {
      expect(folders[0]!.name).toBe("Finance");
    }
    expect(decrypted.entries[0]!.folderId).toBe(folderId);
    expect(decrypted.updatedAt).toBe(vault.updatedAt);

    // 4. Test "Movement" (Simulated)
    const firstEntry = decrypted.entries[0];
    if (firstEntry) {
      firstEntry.folderId = undefined;
    }
    decrypted.updatedAt = (decrypted.updatedAt || 0) + 1000;
    
    expect(decrypted.updatedAt).toBeGreaterThan(vault.updatedAt || 0);
  });
});
