import { defineConfig } from 'vitest/config';

// Browser tests need a production build and a Chromium; they are kept out of
// `npm run validate` and run with `npm run test:e2e` (see README).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.e2e.ts'],
    testTimeout: 180_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
