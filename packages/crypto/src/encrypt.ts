import type { EncryptedPayload } from "./types";
import { ENCRYPTED_PAYLOAD_VERSION } from "./types";

export async function encryptData(
  key: CryptoKey,
  data: unknown,
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );

  return {
    version: ENCRYPTED_PAYLOAD_VERSION,
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
}
