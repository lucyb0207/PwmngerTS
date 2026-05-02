import { argon2id } from "hash-wasm";
import { stringToUint8Array } from "./wipe";

/**
 * Derives Argon2id output, then splits into separate keys via HKDF.
 * Master key bytes never leave this function as an exported key — only derived sub-keys.
 */
export async function deriveKeysFromPassword(
  password: string | Uint8Array,
  salt: Uint8Array | ArrayBuffer,
): Promise<{ encryptionKey: CryptoKey; authKey: CryptoKey }> {
  const saltUint8 = salt instanceof Uint8Array ? salt : new Uint8Array(salt);
  const passwordBytes =
    typeof password === "string" ? stringToUint8Array(password) : password;

  console.log("Crypto: Starting Argon2id derivation...");
  const rawMaster = await argon2id({
    password: passwordBytes,
    salt: saltUint8,
    parallelism: 4,
    iterations: 10,
    memorySize: 65536,
    hashLength: 32,
    outputType: "binary",
  });
  console.log("Crypto: Argon2id derivation complete.");

  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    rawMaster as BufferSource,
    { name: "HKDF" },
    false,
    ["deriveKey"],
  );

  const fixedSalt = new Uint8Array(32);
  const te = new TextEncoder();

  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: fixedSalt,
      info: te.encode("pwmnger-encryption-v1"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
  );

  const authKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: fixedSalt,
      info: te.encode("pwmnger-auth-v1"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  return { encryptionKey, authKey };
}

/** SHA-256 hex digest of raw auth key material — safe to send to the server (never send encryptionKey). */
export async function hashAuthKeyForServer(authKey: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", authKey);
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(raw));
  return bufferToHex(new Uint8Array(digest));
}

function bufferToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
