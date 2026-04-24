import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,ts}'],
    exclude: ['node_modules']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'js')
    }
  }
});
