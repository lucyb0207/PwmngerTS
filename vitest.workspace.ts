import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/web/vite.config.ts',
  'apps/backend/vitest.config.ts',
  'packages/appLogic/vitest.config.ts',
  'packages/crypto/vitest.config.ts',
  'packages/storage/vitest.config.ts',
  'packages/vault/vitest.config.ts',
  'packages/ui/vitest.config.ts',
  'apps/extension/vitest.config.ts',
])
