import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      'server-only': path.resolve(rootDir, 'src/test/server-only.ts'),
    },
  },
  test: {
    clearMocks: true,
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
})
