import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }) as Plugin,
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'istanbul',
      reportsDirectory: resolve('./coverage'),
      reporter: ['text', 'lcov'],
      exclude: ['tests/mocks/**', 'utils/scripts/**'],
    },
  },
});
