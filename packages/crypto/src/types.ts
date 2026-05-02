export const ENCRYPTED_PAYLOAD_VERSION = 1;

export type EncryptedPayload = {
  version: number;
  iv: number[];
  data: number[];
};
