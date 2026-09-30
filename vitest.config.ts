import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Automatic JSX runtime, like Next — lets tests render components
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
