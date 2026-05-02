import { encryptData } from "./encrypt";
import { decryptData } from "./decrypt";
import { deriveKeysFromPassword, hashAuthKeyForServer } from "./kdf";
import { randomBytes } from "./random";
import { generateVaultKey } from "./vaultKey";
import { MissingVersionError } from "@pwmnger/errors";
import { describe, beforeAll, test, expect } from "vitest";

describe("Crypto Package", () => {
  let encryptionKey: CryptoKey;
  let authKey: CryptoKey;
  const testData = {
    username: "john_doe",
    password: "secret123",
    email: "john@example.com",
  };
  let salt: Uint8Array;

  beforeAll(async () => {
    salt = randomBytes(16);
    const keys = await deriveKeysFromPassword("MySecurePassword123!", salt);
    encryptionKey = keys.encryptionKey;
    authKey = keys.authKey;
  }, 60000);

  test("Test 1: Random Bytes Generation", () => {
    const randomData = randomBytes(16);
    expect(randomData.length).toBe(16);
    expect(randomData).toBeInstanceOf(Uint8Array);
  });

  test("Test 2: Vault Key Generation", async () => {
    const vaultKey = await generateVaultKey();
    expect(vaultKey).toBeDefined();
    expect((vaultKey as any).type).toBe("secret");
  });

  test("Test 3: HKDF split: encryptionKey and authKey differ", async () => {
    const k = await deriveKeysFromPassword("SamePassword123!", salt);
    expect(k.encryptionKey).not.toBe(k.authKey);
  }, 60000);

  test("Test 3b: Only authKey is extractable for hashing", async () => {
    const k = await deriveKeysFromPassword("Pw123!", salt);
    await expect(crypto.subtle.exportKey("raw", k.authKey)).resolves.toBeInstanceOf(
      ArrayBuffer,
    );
    await expect(crypto.subtle.exportKey("raw", k.encryptionKey)).rejects.toThrow();
  }, 60000);

  test("Test 4: Encryption/Decryption Cycle", async () => {
    const encrypted = await encryptData(encryptionKey, testData);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.data).toBeDefined();
    expect(encrypted.version).toBe(1);

    const decrypted = await decryptData(encryptionKey, {
      iv: Array.from(new Uint8Array(encrypted.iv)),
      data: Array.from(new Uint8Array(encrypted.data)),
      version: encrypted.version,
    });

    expect(decrypted).toEqual(testData);
  });

  test("Test 5: Encryption Randomness Check", async () => {
    const encrypted1 = await encryptData(encryptionKey, testData);
    const encrypted2 = await encryptData(encryptionKey, testData);

    const ivMatch = Array.from(encrypted1.iv).every(
      (v, i) => v === encrypted2.iv[i],
    );
    expect(ivMatch).toBe(false);
  });

  test("Test 6: Wrong Key Fails Decryption", async () => {
    const encrypted = await encryptData(encryptionKey, testData);
    const wrongPassword = "WrongPassword123!";
    const wrongKeys = await deriveKeysFromPassword(wrongPassword, salt);

    await expect(
      decryptData(wrongKeys.encryptionKey, {
        iv: Array.from(new Uint8Array(encrypted.iv)),
        data: Array.from(new Uint8Array(encrypted.data)),
        version: encrypted.version,
      }),
    ).rejects.toThrow();
  }, 60000);

  test("Test 7: Empty String Encryption", async () => {
    const emptyData = { secret: "" };
    const encrypted = await encryptData(encryptionKey, emptyData);
    const decrypted = await decryptData(encryptionKey, {
      iv: Array.from(new Uint8Array(encrypted.iv)),
      data: Array.from(new Uint8Array(encrypted.data)),
      version: encrypted.version,
    });
    expect(decrypted).toEqual(emptyData);
  });

  test("Test 8: Large Payload Stress Test", async () => {
    const largeString = "a".repeat(1024 * 1024);
    const largeData = { blob: largeString };
    const encrypted = await encryptData(encryptionKey, largeData);
    const decrypted = await decryptData(encryptionKey, {
      iv: Array.from(new Uint8Array(encrypted.iv)),
      data: Array.from(new Uint8Array(encrypted.data)),
      version: encrypted.version,
    });
    expect(decrypted).toEqual(largeData);
  });

  test("Test 9: hashAuthKeyForServer is stable SHA-256 hex", async () => {
    const h1 = await hashAuthKeyForServer(authKey);
    const h2 = await hashAuthKeyForServer(authKey);
    expect(h1).toBe(h2);
    expect(h1.length).toBe(64);
  });

  test("Test 10: Unicode/Symbol Handling", async () => {
    const unicodeData = { secret: "🔐 漢字 😂 Δ" };
    const encrypted = await encryptData(encryptionKey, unicodeData);
    const decrypted = await decryptData(encryptionKey, {
      iv: Array.from(new Uint8Array(encrypted.iv)),
      data: Array.from(new Uint8Array(encrypted.data)),
      version: encrypted.version,
    });
    expect(decrypted).toEqual(unicodeData);
  });
});

describe("Encrypted payload versioning", () => {
  test("decryptData throws MissingVersionError when version is missing", async () => {
    const salt = randomBytes(16);
    const { encryptionKey } = await deriveKeysFromPassword("x", salt);
    const badPayload = {
      iv: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      data: [1],
    } as { iv: number[]; data: number[]; version?: number };

    await expect(
      decryptData(encryptionKey, badPayload as any),
    ).rejects.toThrow(MissingVersionError);
  }, 60000);
});
