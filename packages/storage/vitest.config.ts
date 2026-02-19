import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    alias: {
      '@pwmnger/storage': path.resolve(__dirname, './src'),
    },
  },
});
