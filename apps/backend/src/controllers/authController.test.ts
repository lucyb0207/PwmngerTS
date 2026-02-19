import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { register, login } from "./authController";
import { hash, verify } from "argon2";
import { sign } from "jsonwebtoken";
import { prisma } from "../db/prisma";
import type { Request, Response } from "express";

// Mock dependencies
vi.mock("argon2", () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("jsonwebtoken", () => ({
  sign: vi.fn(),
}));
vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn().mockReturnValue({
      toString: vi.fn().mockReturnValue("mock-refresh-token"),
    }),
  },
}));
vi.mock("../db/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
  },
}));

describe("Auth Controller", () => {
  let mockReq: Partial<Request>;
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
      cookies: {},
    };

    mockRes = {
      json: jsonMock,
      status: statusMock,
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    };
  });

  describe("register", () => {
    it("should register a new user with hashed password", async () => {
      const email = "test@example.com";
      const authHash = "password123";
      const hashedPassword = "hashed_password_123";

      mockReq.body = { email, authHash };

      vi.mocked(hash).mockResolvedValue(hashedPassword);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        email,
        passwordHash: hashedPassword,
      } as any);
      vi.mocked(sign).mockReturnValue("mock-access-token" as any);

      process.env.JWT_SECRET = "test_secret";
      process.env.REFRESH_SECRET = "refresh_secret";

      await register(mockReq as any, mockRes as any, nextMock);

      expect(hash).toHaveBeenCalledWith(authHash);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email, passwordHash: hashedPassword },
      });
      expect(mockRes.cookie).toHaveBeenCalledWith("accessToken", expect.any(String), expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith("refreshToken", "mock-refresh-token", expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith({ 
        success: true,
        accessToken: expect.any(String),
        refreshToken: "mock-refresh-token"
      });
    });

    it("should handle duplicate email error", async () => {
      const email = "existing@example.com";
      const authHash = "password123";

      mockReq.body = { email, authHash };

      vi.mocked(hash).mockResolvedValue("hashed");
      const error = new Error("Unique constraint violation");
      (error as any).code = "P2002";
      vi.mocked(prisma.user.create).mockRejectedValue(error);

      await register(mockReq as any, mockRes as any, nextMock);
      
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({
        message: "An account with this email already exists",
        statusCode: 409
      }));
    });
  });

  describe("login", () => {
    const email = "test@example.com";
    const authHash = "password123";
    const hashedPassword = "hashed_password_123";
    const userId = "user-123";
    const token = "jwt_token_123";

    it("should login user with correct password", async () => {
      mockReq.body = { email, authHash };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email,
        passwordHash: hashedPassword,
      } as any);

      vi.mocked(verify).mockResolvedValue(true);

      vi.mocked(sign).mockReturnValue(token as any);

      process.env.JWT_SECRET = "test_secret";

      await login(mockReq as any, mockRes as any, nextMock);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(verify).toHaveBeenCalledWith(hashedPassword, authHash);
      expect(mockRes.cookie).toHaveBeenCalledWith("accessToken", token, expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith("refreshToken", "mock-refresh-token", expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith({ 
        success: true,
        accessToken: token,
        refreshToken: "mock-refresh-token"
      });
    });

    it("should return 401 if user not found", async () => {
      mockReq.body = { email, authHash };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await login(mockReq as any, mockRes as any, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({
        message: "Invalid login",
        statusCode: 401
      }));
    });

    it("should return 401 if password is incorrect", async () => {
      mockReq.body = { email, authHash };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email,
        passwordHash: hashedPassword,
        twoFactorSecret: null,
        createdAt: new Date(),
      } as any);

      vi.mocked(verify).mockResolvedValue(false);

      await login(mockReq as any, mockRes as any, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({
        message: "Invalid login",
        statusCode: 401
      }));
    });

    it("should include correct JWT expiration", async () => {
      mockReq.body = { email, authHash };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email,
        passwordHash: hashedPassword,
        twoFactorSecret: null,
        createdAt: new Date(),
      } as any);

      vi.mocked(verify).mockResolvedValue(true);
      vi.mocked(sign).mockReturnValue(token as any);

      process.env.JWT_SECRET = "test_secret";

      await login(mockReq as any, mockRes as any, nextMock);

      const signCall = vi.mocked(sign).mock.calls[0];
      if (!signCall) throw new Error("sign was not called");
      expect(signCall[2]).toEqual({ expiresIn: "15m" });
    });
  });
});
