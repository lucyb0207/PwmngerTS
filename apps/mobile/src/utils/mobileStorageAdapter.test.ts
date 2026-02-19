import { mobileStorage } from './mobileStorageAdapter';
import * as SecureStore from 'expo-secure-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('expo-secure-store', () => ({
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

describe('mobileStorageAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockVault = {
    id: 'vault-1',
    data: 'encrypted-blob',
    metadata: { version: 1 }
  };

  it('saves vault data as JSON string', async () => {
    await mobileStorage.saveVault(mockVault as any);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'pwmnger_vault',
      JSON.stringify(mockVault)
    );
  });

  it('loads and parses vault data from JSON', async () => {
    (SecureStore.getItemAsync as any).mockResolvedValue(JSON.stringify(mockVault));
    const vault = await mobileStorage.loadVault();
    expect(vault).toEqual(mockVault);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('pwmnger_vault');
  });

  it('returns null when no vault is stored', async () => {
    (SecureStore.getItemAsync as any).mockResolvedValue(null);
    const vault = await mobileStorage.loadVault();
    expect(vault).toBeNull();
  });

  it('saves and loads auth token directly', async () => {
    await mobileStorage.saveAuthToken('test-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('pwmnger_token', 'test-token');

    (SecureStore.getItemAsync as any).mockResolvedValue('test-token');
    const token = await mobileStorage.loadAuthToken();
    expect(token).toBe('test-token');
  });

  it('clears vault and token', async () => {
    await mobileStorage.clearVault();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('pwmnger_vault');

    await mobileStorage.clearAuthToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('pwmnger_token');
  });
});
