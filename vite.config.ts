/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
    // 本机 Node 在资源紧张时并行 fork 会 spawn UNKNOWN；单进程串行更稳
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/hooks/**'],
      exclude: ['src/domain/types.ts', 'src/domain/constants.ts'],
      reporter: ['text', 'html'],
    },
  },
});
