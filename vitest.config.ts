import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  oxc: false,
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }) as Plugin,
  ],
  resolve: {
    tsconfigPaths: true,
  },
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
