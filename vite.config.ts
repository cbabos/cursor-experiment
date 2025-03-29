import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util', 'events', 'crypto', 'path', 'process'],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    deps: {
      inline: ['@mui/material'],
    },
  },
  resolve: {
    alias: {
      'node-imap': 'node-imap/lib/imap',
      'mailparser': 'mailparser/lib/parser',
      stream: 'stream-browserify',
      buffer: 'buffer',
      events: 'events',
      util: 'util',
      net: 'net-browserify',
      tls: 'tls-browserify',
      crypto: 'crypto-browserify',
      path: 'path-browserify',
      zlib: 'browserify-zlib',
      dns: 'dns-browserify',
    },
  },
  optimizeDeps: {
    exclude: ['node-imap', 'mailparser'],
    include: [
      'buffer',
      'stream-browserify',
      'events',
      'util',
      'net-browserify',
      'tls-browserify',
      'crypto-browserify',
      'path-browserify',
      'browserify-zlib',
      'dns-browserify',
    ],
  },
  define: {
    'process.env': {},
  },
})
