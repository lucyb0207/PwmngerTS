import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { uploadVault, downloadVault } from "./vaultController";
import { prisma } from "../db/prisma";
import type { Request, Response } from "express";

// Mock dependencies
vi.mock("../db/prisma", () => ({
  prisma: {
    vault: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

interface AuthRequest extends Request {
  user?: { userId: string };
}

describe("Vault Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;
  let nextMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn().mockReturnValue(undefined);
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    nextMock = vi.fn();

    mockReq = {
      body: {},
      user: { userId: "user-123" },
    };

    mockRes = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe("uploadVault", () => {
    it("should create a new vault if it doesn't exist", async () => {
      const vaultPayload = { iv: [1, 2, 3], data: [4, 5, 6] };
      mockReq.body = { vaultPayload };

      vi.mocked(prisma.vault.upsert).mockResolvedValue({
        id: "vault-123",
        encrypted: JSON.stringify(vaultPayload),
        userId: "user-123",
        updatedAt: new Date(),
      } as any);

      await uploadVault(mockReq as any, mockRes as any, nextMock);

      expect(prisma.vault.upsert).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        update: { encrypted: JSON.stringify(vaultPayload) },
        create: { encrypted: JSON.stringify(vaultPayload), userId: "user-123" },
      });
      expect(jsonMock).toHaveBeenCalledWith({ success: true });
    });

    it("should update existing vault", async () => {
      const vaultPayload = { iv: [1, 2, 3], data: [4, 5, 6] };
      const newVaultPayload = { iv: [7, 8, 9], data: [10, 11, 12] };

      mockReq.body = { vaultPayload: newVaultPayload };

      vi.mocked(prisma.vault.upsert).mockResolvedValue({
        id: "vault-123",
        encrypted: JSON.stringify(newVaultPayload),
        userId: "user-123",
        updatedAt: new Date(),
      } as any);

      await uploadVault(mockReq as any, mockRes as any, nextMock);

      expect(prisma.vault.upsert).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        update: { encrypted: JSON.stringify(newVaultPayload) },
        create: { encrypted: JSON.stringify(newVaultPayload), userId: "user-123" },
      });
      expect(jsonMock).toHaveBeenCalledWith({ success: true });
    });

    it("should handle database errors", async () => {
      const vaultPayload = { iv: [1, 2, 3], data: [4, 5, 6] };
      mockReq.body = { vaultPayload };

      vi.mocked(prisma.vault.upsert).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(uploadVault(mockReq as any, mockRes as any, nextMock)).rejects.toThrow(
        "Database error",
      );
    });

    it("should use correct userId from request", async () => {
      const vaultPayload = { iv: [1, 2, 3], data: [4, 5, 6] };
      mockReq.body = { vaultPayload };
      mockReq.user = { userId: "user-456" };

      vi.mocked(prisma.vault.upsert).mockResolvedValue({
        id: "vault-456",
        encrypted: JSON.stringify(vaultPayload),
        userId: "user-456",
        updatedAt: new Date(),
      } as any);

      await uploadVault(mockReq as any, mockRes as any, nextMock);

      const upsertCall = vi.mocked(prisma.vault.upsert).mock.calls[0];
      if (!upsertCall) throw new Error("upsert was not called");
      const call = upsertCall[0];
      expect(call.where.userId).toBe("user-456");
      expect(call.create.userId).toBe("user-456");
    });
  });

  describe("downloadVault", () => {
    it("should return encrypted vault if exists", async () => {
      const encryptedVault = { iv: [1, 2, 3], data: [4, 5, 6] };

      vi.mocked(prisma.vault.findUnique).mockResolvedValue({
        id: "vault-123",
        encrypted: encryptedVault,
        userId: "user-123",
        updatedAt: new Date(),
      } as any);

      await downloadVault(mockReq as any, mockRes as any, nextMock);

      expect(prisma.vault.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
      expect(jsonMock).toHaveBeenCalledWith({
        vaultPayload: encryptedVault,
      });
    });

    it("should return null if vault doesn't exist", async () => {
      (prisma.vault.findUnique as Mock).mockResolvedValue(null);

      await downloadVault(mockReq as any, mockRes as any, nextMock);

      expect(jsonMock).toHaveBeenCalledWith({ vaultPayload: null });
    });

    it("should query with correct userId", async () => {
      mockReq.user = { userId: "user-789" };

      vi.mocked(prisma.vault.findUnique).mockResolvedValue(null);

      await downloadVault(mockReq as any, mockRes as any, nextMock);

      expect(prisma.vault.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-789" },
      });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      vi.mocked(prisma.vault.findUnique).mockRejectedValue(error);

      await downloadVault(mockReq as any, mockRes as any, nextMock);

      expect(nextMock).toHaveBeenCalledWith(error);
    });

    it("should return vault with correct structure", async () => {
      const encryptedVault = { iv: [7, 8, 9], data: [10, 11, 12] };

      vi.mocked(prisma.vault.findUnique).mockResolvedValue({
        id: "vault-123",
        encrypted: encryptedVault,
        userId: "user-123",
        updatedAt: new Date("2026-01-29T10:00:00Z"),
      } as any);

      await downloadVault(mockReq as any, mockRes as any, nextMock);

      expect(jsonMock).toHaveBeenCalledWith({
        vaultPayload: encryptedVault,
      });
    });
  });
});
