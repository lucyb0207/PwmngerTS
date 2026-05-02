/**
 * In-memory only store for CryptoKey material. Never serializes keys.
 * Call clear() on vault lock, session timeout, and tab/window unload.
 */
export class KeyVault {
  private static instance: KeyVault;
  private readonly keys = new Map<string, CryptoKey>();

  private constructor() {}

  static getInstance(): KeyVault {
    if (!KeyVault.instance) KeyVault.instance = new KeyVault();
    return KeyVault.instance;
  }

  set(id: string, key: CryptoKey): void {
    this.keys.set(id, key);
  }

  get(id: string): CryptoKey | undefined {
    return this.keys.get(id);
  }

  delete(id: string): void {
    this.keys.delete(id);
  }

  clear(): void {
    this.keys.clear();
  }
}

export const keyVault = KeyVault.getInstance();
