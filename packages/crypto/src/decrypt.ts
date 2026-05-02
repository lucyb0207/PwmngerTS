import { MissingVersionError } from "@pwmnger/errors";
import type { EncryptedPayload } from "./types";

export async function decryptData<T>(
  key: CryptoKey,
  payload: EncryptedPayload,
): Promise<T> {
  if (payload.version === undefined) {
    throw new MissingVersionError();
  }

  const iv = new Uint8Array(payload.iv);
  const data = new Uint8Array(payload.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}
