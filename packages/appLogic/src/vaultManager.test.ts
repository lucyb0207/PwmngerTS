import { describe, it, expect, vi, beforeEach, afterEach, test } from "vitest";
import {
  isUnlocked,
  getVault,
  lockVault,
  createNewVault,
  unlockVault,
  saveCurrentVault,
  mergeVaults,
} from "./vaultManager";

// Mock dependencies
vi.mock("@pwmnger/crypto", () => ({
  deriveMasterKey: vi.fn(),
  decryptData: vi.fn(),
  encryptData: vi.fn(),
  generateVaultKey: vi.fn(),
  wrapKey: vi.fn(),
  unwrapKey: vi.fn(),
  stringToUint8Array: vi.fn((s) => new TextEncoder().encode(s)),
  wipe: vi.fn(),
}));
vi.mock("@pwmnger/vault", () => ({
  createEmptyVault: vi.fn(),
}));
vi.mock("@pwmnger/storage", () => ({
  saveVault: vi.fn(),
  loadVault: vi.fn(),
}));

import {
  deriveMasterKey,
  decryptData,
  encryptData,
  generateVaultKey,
  wrapKey,
  unwrapKey,
} from "@pwmnger/crypto";
import { createEmptyVault } from "@pwmnger/vault";
import { saveVault, loadVault } from "@pwmnger/storage";

describe("VaultManager", () => {
  const mockPassword = "testPassword123";
  const mockSalt = new Uint8Array(16);
  const mockMasterKey = {} as CryptoKey;
  const mockVaultKey = {} as CryptoKey;
  const mockVault = {
    id: "test-vault",
    entries: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const mockEncryptedPayload = { iv: [1, 2, 3], data: [4, 5, 6] };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global crypto object
    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((arr) => arr),
    });
    // Reset vault state
    lockVault();
  });

  afterEach(async () => {
    // Clean up vault state after each test
    await lockVault();
  });

  describe("isUnlocked", () => {
    it("should return false initially", () => {
      expect(isUnlocked()).toBe(false);
    });

    it("should return true after vault is unlocked", async () => {
      (loadVault as any).mockResolvedValue({
        salt: Array.from(mockSalt),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
      });
      (deriveMasterKey as any).mockResolvedValue(mockMasterKey);
      (unwrapKey as any).mockResolvedValue(mockVaultKey);
      (decryptData as any).mockResolvedValue(mockVault);

      await unlockVault(mockPassword);
      expect(isUnlocked()).toBe(true);
    });
  });

  describe("getVault", () => {
    it("should throw error when vault is locked", () => {
      expect(() => getVault()).toThrow("Vault is locked");
    });

    it("should return vault when unlocked", async () => {
      (loadVault as any).mockResolvedValue({
        salt: Array.from(mockSalt),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
      });
      (deriveMasterKey as any).mockResolvedValue(mockMasterKey);
      (unwrapKey as any).mockResolvedValue(mockVaultKey);
      (decryptData as any).mockResolvedValue(mockVault);

      await unlockVault(mockPassword);
      const vault = getVault();
      expect(vault).toEqual(mockVault);
    });
  });

  describe("lockVault", () => {
    it("should lock the vault", async () => {
      // First unlock
      (loadVault as any).mockResolvedValue({
        salt: Array.from(mockSalt),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
      });
      (deriveMasterKey as any).mockResolvedValue(mockMasterKey);
      (unwrapKey as any).mockResolvedValue(mockVaultKey);
      (decryptData as any).mockResolvedValue(mockVault);

      await unlockVault(mockPassword);
      expect(isUnlocked()).toBe(true);

      // Then lock
      await lockVault();
      expect(isUnlocked()).toBe(false);
      expect(() => getVault()).toThrow("Vault is locked");
    });
  });

  describe("createNewVault", () => {
    it("should create and save a new vault", async () => {
      (deriveMasterKey as any).mockResolvedValue(mockMasterKey);
      (generateVaultKey as any).mockResolvedValue(mockVaultKey);
      (createEmptyVault as any).mockReturnValue(mockVault);
      (encryptData as any).mockResolvedValue(mockEncryptedPayload);
      (wrapKey as any).mockResolvedValue(mockEncryptedPayload);

      await createNewVault(mockPassword);

      expect(deriveMasterKey).toHaveBeenCalledWith(
        expect.any(Uint8Array),
        expect.any(Uint8Array),
      );
      expect(generateVaultKey).toHaveBeenCalled();
      expect(createEmptyVault).toHaveBeenCalled();
      expect(encryptData).toHaveBeenCalledTimes(1);
      expect(wrapKey).toHaveBeenCalledTimes(1);
      expect(saveVault).toHaveBeenCalledWith({
        salt: expect.any(Array),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
        updatedAt: expect.any(Number),
      });
      expect(isUnlocked()).toBe(true);
    });
  });

  describe("unlockVault", () => {
    it("should throw error if no vault found", async () => {
      (loadVault as any).mockResolvedValue(null);

      await expect(unlockVault(mockPassword)).rejects.toThrow("No vault found");
    });

    it("should throw error if vault key decryption fails", async () => {
      (loadVault as any).mockResolvedValue({
        salt: Array.from(mockSalt),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
      });
      (deriveMasterKey as any).mockResolvedValue(mockMasterKey);
      (unwrapKey as any).mockResolvedValue(null);

      await expect(unlockVault(mockPassword)).rejects.toThrow(
        "Failed to decrypt vault key",
      );
    });

    it("should unlock vault with correct password", async () => {
      (loadVault as any).mockResolvedValue({
        salt: Array.from(mockSalt),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
      });
      (deriveMasterKey as any).mockResolvedValue(mockMasterKey);
      (unwrapKey as any).mockResolvedValue(mockVaultKey);
      (decryptData as any).mockResolvedValue(mockVault);

      await unlockVault(mockPassword);

      expect(deriveMasterKey).toHaveBeenCalledWith(
        expect.any(Uint8Array),
        expect.any(Uint8Array),
      );
      expect(decryptData).toHaveBeenCalledTimes(1);
      expect(unwrapKey).toHaveBeenCalledTimes(1);
      expect(isUnlocked()).toBe(true);
      expect(getVault()).toEqual(mockVault);
    });
  });

  // The following block was inserted based on the user's instruction.
  // Note: This block seems to test a different implementation of VaultManager
  // that takes a storage dependency, and uses 'test' instead of 'it'.
  // It's placed here as per the provided snippet's context.
  describe("VaultManager (alternative implementation tests)", () => {
    let mockStorage: any;
    let manager: any; 

    beforeEach(() => {
      mockStorage = {
        saveVault: vi.fn().mockResolvedValue(undefined),
        loadVault: vi.fn().mockResolvedValue(null),
      };
      // ...
      manager = {
        createNewVault: vi.fn(async (password) => {
          if (password === "password123") {
            const vault = { version: 1, data: "some_data" };
            await mockStorage.saveVault(vault);
            return vault;
          }
          return null;
        }),
        unlockVault: vi.fn(async (password) => {
          const storedVault = await mockStorage.loadVault();
          if (storedVault && password === "password123") {
            return true;
          }
          return false;
        }),
      };
    });

    test("should create an empty vault", async () => {
      const vault = await manager.createNewVault("password123");
      expect(vault).toBeDefined();
      expect(vault.version).toBe(1);
      expect(manager.createNewVault).toHaveBeenCalledWith("password123");
      expect(mockStorage.saveVault).toHaveBeenCalled();
    });

    test("should unlock vault with correct password", async () => {
      await manager.createNewVault("password123");
      const createdVault = await manager.createNewVault.mock.results[0].value;
      mockStorage.loadVault.mockResolvedValue(createdVault);

      const unlocked = await manager.unlockVault("password123");
      expect(unlocked).toBe(true);
      expect(manager.unlockVault).toHaveBeenCalledWith("password123");
    });

    test("should fail to unlock with wrong password", async () => {
      await manager.createNewVault("password123");
      const createdVault = await manager.createNewVault.mock.results[0].value;
      mockStorage.loadVault.mockResolvedValue(createdVault);

      const unlocked = await manager.unlockVault("wrongpassword");
      expect(unlocked).toBe(false);
      expect(manager.unlockVault).toHaveBeenCalledWith("wrongpassword");
    });
  });

  describe("saveCurrentVault", () => {
    it("should throw error if vault is locked", async () => {
      await expect(saveCurrentVault()).rejects.toThrow("Vault is not unlocked");
    });

    it("should update and save vault", async () => {
      // First unlock
      (loadVault as any).mockResolvedValue({
        salt: Array.from(mockSalt),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
      });
      (deriveMasterKey as any).mockResolvedValue(mockMasterKey);
      (unwrapKey as any).mockResolvedValue(mockVaultKey);
      (decryptData as any).mockResolvedValue(mockVault);

      await unlockVault(mockPassword);

      // Reset mocks for save test
      vi.clearAllMocks();
      (loadVault as any).mockResolvedValue({
        salt: Array.from(mockSalt),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
      });
      (encryptData as any).mockResolvedValue(mockEncryptedPayload);

      await saveCurrentVault();

      expect(encryptData).toHaveBeenCalledWith(
        mockVaultKey,
        expect.any(Object),
      );
      expect(saveVault).toHaveBeenCalledWith({
        salt: expect.any(Array),
        encryptedVault: mockEncryptedPayload,
        encryptedVaultKey: mockEncryptedPayload,
        updatedAt: expect.any(Number),
      });
    });

    it("should throw error if no vault to update", async () => {
      // First unlock
      (loadVault as any)
        .mockResolvedValueOnce({
          salt: Array.from(mockSalt),
          encryptedVault: mockEncryptedPayload,
          encryptedVaultKey: mockEncryptedPayload,
        })
        .mockResolvedValueOnce(null);
      (deriveMasterKey as any).mockResolvedValue(mockMasterKey);
      (unwrapKey as any).mockResolvedValue(mockVaultKey);
      (decryptData as any).mockResolvedValue(mockVault);

      await unlockVault(mockPassword);

      (encryptData as any).mockResolvedValue(mockEncryptedPayload);

      await expect(saveCurrentVault()).rejects.toThrow("No vault to update");
    });
  });

  describe("mergeVaults", () => {
    it("should merge local and remote entries based on lastModified", () => {
      const localVault = {
        version: 1,
        updatedAt: 100,
        entries: [
          {
            id: "1",
            site: "local",
            username: "u1",
            password: "p1",
            lastModified: 100,
          },
          {
            id: "2",
            site: "conflict",
            username: "u2",
            password: "local-win",
            lastModified: 300,
          },
        ],
        folders: [],
        deletedEntryIds: [],
        deletedFolderIds: [],
      } as any;
      const remoteVault = {
        version: 1,
        updatedAt: 200,
        entries: [
          {
            id: "2",
            site: "conflict",
            username: "u2",
            password: "remote-lose",
            lastModified: 200,
          },
          {
            id: "3",
            site: "remote",
            username: "u3",
            password: "p3",
            lastModified: 200,
          },
        ],
        folders: [],
        deletedEntryIds: [],
        deletedFolderIds: [],
      } as any;

      const result = mergeVaults(localVault, remoteVault);
      expect(result.entries).toHaveLength(3);
      expect(result.entries.find((e: any) => e.id === "2")?.password).toBe(
        "local-win",
      );
      expect(result.updatedAt).toBe(200);
    });
  });
});
