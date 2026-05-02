import {
  decryptData,
  encryptData,
  deriveKeysFromPassword,
  generateVaultKey,
  wrapKey,
  unwrapKey,
  migrateEncryptedPayload,
} from "@pwmnger/crypto";
import { createEmptyVault } from "@pwmnger/vault";
import { StoredVault } from "@pwmnger/storage";

export async function createEncryptedVault(
  masterPassword: string,
): Promise<StoredVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const { encryptionKey } = await deriveKeysFromPassword(masterPassword, salt);
  const vaultKey = await generateVaultKey();
  const emptyVault = createEmptyVault();

  const encryptedVault = await encryptData(vaultKey, emptyVault);
  const encryptedVaultKey = await wrapKey(encryptionKey, vaultKey);

  return {
    salt: Array.from(salt),
    encryptedVault,
    encryptedVaultKey,
    updatedAt: Date.now(),
  };
}

export async function decryptVault(
  vault: StoredVault,
  masterPassword: string,
): Promise<any> {
  try {
    const salt = new Uint8Array(vault.salt);
    const { encryptionKey } = await deriveKeysFromPassword(masterPassword, salt);
    const vaultKey = await unwrapKey(
      encryptionKey,
      migrateEncryptedPayload(vault.encryptedVaultKey),
    );
    const decryptedVault = await decryptData<any>(
      vaultKey,
      migrateEncryptedPayload(vault.encryptedVault),
    );
    return decryptedVault;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Invalid master password or corrupted data");
  }
}

export async function encryptVault(
  vault: any,
  masterPassword: string,
  salt: Uint8Array,
): Promise<StoredVault> {
  const { encryptionKey } = await deriveKeysFromPassword(masterPassword, salt);
  const vaultKey = await generateVaultKey();
  const encryptedVault = await encryptData(vaultKey, vault);
  const encryptedVaultKey = await wrapKey(encryptionKey, vaultKey);

  return {
    salt: Array.from(salt),
    encryptedVault,
    encryptedVaultKey,
    updatedAt: Date.now(),
  };
}
