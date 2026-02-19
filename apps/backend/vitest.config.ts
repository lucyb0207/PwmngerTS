import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@pwmnger/crypto': path.resolve(__dirname, '../../packages/crypto/src'),
      '@pwmnger/vault': path.resolve(__dirname, '../../packages/vault/src'),
      '@pwmnger/storage': path.resolve(__dirname, '../../packages/storage/src'),
      '@pwmnger/app-logic': path.resolve(__dirname, '../../packages/appLogic/src'),
    },
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
