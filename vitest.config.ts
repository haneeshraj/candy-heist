import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    // The page tests render whole pages in jsdom; on a busy machine a
    // file's first render can outrun the 5 s default.
    testTimeout: 15000,
    // Half the cores: as fast as all of them here (the page tests are
    // heavy, and crowd each other), with room to spare when the machine
    // is busy, so a slow first render doesn't time out.
    maxWorkers: '50%',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
        '.next/**'
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      }
    }
  }
});
