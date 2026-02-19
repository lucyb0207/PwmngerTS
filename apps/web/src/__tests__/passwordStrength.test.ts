import { describe, it, expect, test, afterEach } from 'vitest';
import { getPasswordStrength } from "../utils/passwordStrength";
import { cleanup } from "@testing-library/react";

describe("getPasswordStrength", () => {
  afterEach(() => {
    cleanup();
  });

  test("returns None for empty password", () => {
    expect(getPasswordStrength("")).toBe("None");
  });

  test("returns Very Strong for complex password", () => {
    expect(getPasswordStrength("A1b2C3d4!@#$")).toBe("Very Strong");
  });
});
