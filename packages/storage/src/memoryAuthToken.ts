/** JWT / session bearer tokens must not be persisted to disk; keep in memory only. */
let memoryAuthToken: string | null = null;

export function setMemoryAuthToken(token: string | null): void {
  memoryAuthToken = token;
}

export function getMemoryAuthToken(): string | null {
  return memoryAuthToken;
}
