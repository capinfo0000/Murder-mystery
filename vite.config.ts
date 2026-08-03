import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: mode === 'mock' ? {
    alias: [
      {
        find: /.*\/services\/firebase$/,
        replacement: path.resolve(import.meta.dirname, 'src/services/firebase.mock.ts'),
      },
    ],
  } : {},
}))
