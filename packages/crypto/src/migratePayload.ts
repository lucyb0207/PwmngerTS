import { ENCRYPTED_PAYLOAD_VERSION, type EncryptedPayload } from "./types";

/** Legacy payloads had no version; treat as v1 before decrypt. */
export function migrateEncryptedPayload(
  p: EncryptedPayload | Omit<EncryptedPayload, "version">,
): EncryptedPayload {
  if ("version" in p && p.version !== undefined) {
    return p as EncryptedPayload;
  }
  return { ...(p as Omit<EncryptedPayload, "version">), version: ENCRYPTED_PAYLOAD_VERSION };
}
