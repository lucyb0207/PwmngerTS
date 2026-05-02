import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { guardJsonBody } from "./networkGuard";

vi.mock("@pwmnger/storage", () => ({
  saveAuthToken: vi.fn(),
  loadAuthToken: vi.fn(),
  loadVault: vi.fn(),
  clearAuthToken: vi.fn(),
}));

describe("Outbound HTTP payload guards", () => {
  test("guardJsonBody throws when a CryptoKey appears in the payload", async () => {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt"],
    );
    expect(() => guardJsonBody({ nested: { key } }, "test")).toThrow(
      /SECURITY VIOLATION/,
    );
  });

  test("guardJsonBody allows plain JSON-safe objects", () => {
    expect(() =>
      guardJsonBody({ email: "a@b.com", authHash: "ab".repeat(32) }, "ok"),
    ).not.toThrow();
  });
});

describe("login/register fetch bodies never include CryptoKey", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: "t" }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  test("registerAccount serializes only JSON-safe fields", async () => {
    const { registerAccount } = await import("./auth");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    await registerAccount("u@example.com", "password12345!", salt);
    const call = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes("/auth/register"),
    );
    expect(call).toBeDefined();
    const body = JSON.parse(call![1].body as string);
    expect(body).toEqual({
      email: "u@example.com",
      authHash: expect.any(String),
      kdfSalt: expect.any(Array),
    });
    const walk = (o: unknown): boolean => {
      if (o instanceof CryptoKey) return true;
      if (o && typeof o === "object") {
        return Object.values(o as object).some(walk);
      }
      return false;
    };
    expect(walk(body)).toBe(false);
  }, 60000);
});
