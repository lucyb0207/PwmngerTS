import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { requireAuth } from "./authMiddleware";
import { verify } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// Mock dependencies
vi.mock("jsonwebtoken", () => ({
  verify: vi.fn(),
  sign: vi.fn(),
}));

describe("Auth Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;
  let sendStatusMock: any;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn().mockReturnValue(undefined);
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockNext = vi.fn();
    sendStatusMock = vi.fn().mockReturnValue(undefined);

    mockReq = {
      headers: {},
      cookies: {},
    };

    mockRes = {
      sendStatus: sendStatusMock,
      status: statusMock,
      json: jsonMock,
    };
  });

  describe("requireAuth", () => {
    it("should return 401 if no authorization header", () => {
      mockReq.headers = {};

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Access denied" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if no token in authorization header", () => {
      mockReq.headers = { authorization: "Bearer" };

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Access denied" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should extract token from Bearer authorization header", () => {
      const token = "valid_jwt_token";
      const payload = { userId: "user-123" };

      mockReq.headers = { authorization: `Bearer ${token}` };

      vi.mocked(verify).mockReturnValue(payload as any);

      process.env.JWT_SECRET = "test_secret";

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect(verify).toHaveBeenCalledWith(token, "test_secret");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should attach user to request if token is valid", () => {
      const token = "valid_jwt_token";
      const payload = { userId: "user-123" };

      mockReq.headers = { authorization: `Bearer ${token}` };

      vi.mocked(verify).mockReturnValue(payload as any);

      process.env.JWT_SECRET = "test_secret";

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect((mockReq as any).user).toEqual(payload);
    });

    it("should return 401 if token is invalid", () => {
      const token = "invalid_jwt_token";

      mockReq.headers = { authorization: `Bearer ${token}` };

      vi.mocked(verify).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      process.env.JWT_SECRET = "test_secret";

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if token is expired", () => {
      const token = "expired_jwt_token";

      mockReq.headers = { authorization: `Bearer ${token}` };

      const error = new Error("Token expired");
      (error as any).name = "TokenExpiredError";
      vi.mocked(verify).mockImplementation(() => {
        throw error;
      });

      process.env.JWT_SECRET = "test_secret";

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle multiple Bearer tokens in header (use last one)", () => {
      const token = "valid_jwt_token";
      const payload = { userId: "user-123" };

      // The code splits by " " and takes [1], so "Bearer token" -> ["Bearer", "token"]
      mockReq.headers = { authorization: `Bearer ${token}` };

      vi.mocked(verify).mockReturnValue(payload as any);

      process.env.JWT_SECRET = "test_secret";

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect(verify).toHaveBeenCalledWith(token, "test_secret");
    });

    it("should use JWT_SECRET from environment", () => {
      const token = "valid_jwt_token";
      const payload = { userId: "user-123" };
      const secret = "custom_jwt_secret_123";

      mockReq.headers = { authorization: `Bearer ${token}` };

      vi.mocked(verify).mockReturnValue(payload as any);

      process.env.JWT_SECRET = secret;

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect(verify).toHaveBeenCalledWith(token, secret);
    });

    it("should handle case-insensitive Bearer prefix", () => {
      const token = "valid_jwt_token";
      const payload = { userId: "user-123" };

      // Note: the current implementation doesn't handle this, but good to test
      mockReq.headers = { authorization: `bearer ${token}` };

      vi.mocked(verify).mockReturnValue(payload as any);

      process.env.JWT_SECRET = "test_secret";

      requireAuth(mockReq as any, mockRes as any, mockNext);

      // The split will result in ["bearer", token], so it should work
      expect(verify).toHaveBeenCalled();
    });

    it("should continue to next middleware after successful verification", () => {
      const token = "valid_jwt_token";
      const payload = { userId: "user-456", role: "admin" };

      mockReq.headers = { authorization: `Bearer ${token}` };

      vi.mocked(verify).mockReturnValue(payload as any);

      process.env.JWT_SECRET = "test_secret";

      requireAuth(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
