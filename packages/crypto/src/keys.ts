import { MissingVersionError } from "@pwmnger/errors";
import type { EncryptedPayload } from "./types";
import { ENCRYPTED_PAYLOAD_VERSION } from "./types";

/**
 * Wraps (encrypts) a CryptoKey using another CryptoKey.
 * Useful for securing a vault key with a master key.
 */
export async function wrapKey(
  wrappingKey: CryptoKey,
  keyToWrap: CryptoKey,
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const wrappedKeyBuffer = await crypto.subtle.wrapKey(
    "raw",
    keyToWrap,
    wrappingKey,
    { name: "AES-GCM", iv },
  );

  return {
    version: ENCRYPTED_PAYLOAD_VERSION,
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(wrappedKeyBuffer)),
  };
}

/**
 * Unwraps (decrypts) a CryptoKey using another CryptoKey.
 */
export async function unwrapKey(
  unwrappingKey: CryptoKey,
  wrappedPayload: EncryptedPayload,
  unwrappedKeyAlgorithm: any = { name: "AES-GCM", length: 256 },
  keyUsages: KeyUsage[] = ["encrypt", "decrypt"],
): Promise<CryptoKey> {
  if (wrappedPayload.version === undefined) {
    throw new MissingVersionError();
  }

  const iv = new Uint8Array(wrappedPayload.iv);
  const data = new Uint8Array(wrappedPayload.data);

  return crypto.subtle.unwrapKey(
    "raw",
    data,
    unwrappingKey,
    { name: "AES-GCM", iv },
    unwrappedKeyAlgorithm,
    true,
    keyUsages,
  );
}
