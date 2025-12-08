import { defineConfig } from 'tsup';

export default defineConfig({
  sourcemap: true,
  clean: true,
  format: ['esm'],
  dts: true,
  bundle: false,
});
