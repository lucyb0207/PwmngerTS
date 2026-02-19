import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@pwmnger/crypto': path.resolve(__dirname, '../crypto/src'),
      '@pwmnger/vault': path.resolve(__dirname, '../vault/src'),
      '@pwmnger/storage': path.resolve(__dirname, '../storage/src'),
      '@pwmnger/app-logic': path.resolve(__dirname, './src'),
    },
  },
});
