/**
 * Ensures no CryptoKey objects are serialized into outbound HTTP traffic.
 */
export function assertNotCryptoKey(value: unknown, label: string): void {
  if (value instanceof CryptoKey) {
    throw new Error(
      `SECURITY VIOLATION: CryptoKey passed to network layer: ${label}`,
    );
  }
}

export function deepAssertNoCryptoKey(value: unknown, label = "payload"): void {
  assertNotCryptoKey(value, label);
  if (value && typeof value === "object") {
    if (Array.isArray(value)) {
      value.forEach((item, i) =>
        deepAssertNoCryptoKey(item, `${label}[${String(i)}]`),
      );
    } else {
      for (const [k, v] of Object.entries(value)) {
        deepAssertNoCryptoKey(v, `${label}.${k}`);
      }
    }
  }
}

export function guardJsonBody(body: unknown, label = "requestBody"): void {
  deepAssertNoCryptoKey(body, label);
}
