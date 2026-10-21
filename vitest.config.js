import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'src/features/othello/domain/**/*.test.js',
            'src/features/othello/state/**/*.test.js',
            'src/tests/**/*.node.test.js',
          ],
          exclude: ['tests/e2e/**', 'node_modules/**'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['src/**/*.test.jsx'],
          exclude: ['tests/e2e/**', 'node_modules/**'],
          setupFiles: ['./src/tests/setup.js'],
        },
      },
    ],
  },
});
