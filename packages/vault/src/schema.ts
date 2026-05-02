import type { Vault } from "./types";

export const VAULT_VERSION = 1;

/** Upgrade vault JSON between format versions after decryption. */
export function migrateVault(vault: Vault): Vault {
  let v = vault;
  if (v.version === undefined || v.version < 1) {
    v = { ...v, version: VAULT_VERSION };
  }
  return v;
}
