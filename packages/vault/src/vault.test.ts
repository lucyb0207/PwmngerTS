import { describe, test, expect, beforeEach } from "vitest";
import { createEmptyVault } from "./vault";
import type { VaultEntry, Vault } from "./types";
import { migrateVault, VAULT_VERSION } from "./schema";
import { encryptData } from "../../crypto/src/encrypt";
import { deriveKeysFromPassword } from "../../crypto/src/kdf";
import { randomBytes } from "../../crypto/src/random";

describe("Vault Package", () => {
  let vault: Vault;

  beforeEach(() => {
    vault = createEmptyVault();
  });

  test("Test 1: Create Empty Vault", () => {
    expect(vault.version).toBe(1);
    expect(vault.entries.length).toBe(0);
    expect(vault.updatedAt).toBeGreaterThan(0);
  });

  test("Test 2: Vault Structure Validation", () => {
    expect(vault).toHaveProperty("version");
    expect(vault).toHaveProperty("entries");
    expect(vault).toHaveProperty("updatedAt");
  });

  test("Test 3: Add Entry to Vault", () => {
    const newEntry: VaultEntry = {
      id: "entry-1",
      site: "github.com",
      username: "johndoe",
      password: "encrypted_password_here",
      notes: "Personal GitHub account",
      lastModified: Date.now(),
    };
    vault.entries.push(newEntry);
    expect(vault.entries.length).toBe(1);
    expect(vault.entries[0]!.id).toBe("entry-1");
  });

  test("Test 5: Retrieve Entry", () => {
    const entry1: VaultEntry = {
      id: "entry-1",
      site: "s1",
      username: "u1",
      password: "p1",
      lastModified: Date.now(),
    };
    const entry2: VaultEntry = {
      id: "entry-2",
      site: "s2",
      username: "u2",
      password: "p2",
      lastModified: Date.now(),
    };
    vault.entries.push(entry1, entry2);

    const foundEntry = vault.entries.find((e) => e.id === "entry-2");
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.site).toBe("s2");
  });

  test("Test 7: Delete Entry", () => {
    vault.entries.push({
      id: "entry-1",
      site: "s1",
      username: "u1",
      password: "p1",
      lastModified: Date.now(),
    });
    vault.entries = vault.entries.filter((e) => e.id !== "entry-1");
    expect(vault.entries.length).toBe(0);
  });

  test("Test 9: Vault Serialization", () => {
    vault.entries.push({
      id: "entry-1",
      site: "s1",
      username: "u1",
      password: "p1",
      lastModified: Date.now(),
    });
    const serialized = JSON.stringify(vault);
    const deserialized = JSON.parse(serialized) as Vault;
    expect(deserialized.entries.length).toBe(1);
    expect(deserialized.entries[0]!.site).toBe("s1");
  });

  test("migrateVault upgrades legacy vaults without version", () => {
    const legacy = createEmptyVault();
    delete (legacy as any).version;
    const m = migrateVault(legacy as Vault);
    expect(m.version).toBe(VAULT_VERSION);
  });

  test("encryptData stamps version 1 on ciphertext payload", async () => {
    const salt = randomBytes(16);
    const { encryptionKey } = await deriveKeysFromPassword("vault-test!", salt);
    const enc = await encryptData(encryptionKey, { ping: true });
    expect(enc.version).toBe(1);
  }, 60000);
});
