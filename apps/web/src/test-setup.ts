import '@testing-library/jest-dom';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  cleanup();
});

// React and ReactDOM are now correctly coalesced via vite.config.ts resolution aliases.


// Mock Web Crypto API
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// Global Mock for IntersectionObserver
(globalThis as any).IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  callback: any;
  constructor(callback: any) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
};

// Mock process and Buffer for Argon2/Crypto if needed
if (typeof process === 'undefined') {
  (globalThis as any).process = { env: {} };
}
if (typeof Buffer === 'undefined') {
  import('buffer').then(({ Buffer }) => {
    (globalThis as any).Buffer = Buffer;
  });
}
