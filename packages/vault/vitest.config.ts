import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@pwmnger/vault': path.resolve(__dirname, './src'),
    },
  },
});
