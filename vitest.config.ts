import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/engine/**/*.ts'],
      exclude: ['lib/engine/__tests__/**', 'lib/engine/index.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/engine': path.resolve(__dirname, './lib/engine'),
      '@/types': path.resolve(__dirname, './types'),
    },
  },
});