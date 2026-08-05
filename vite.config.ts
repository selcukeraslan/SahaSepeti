import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'framework',
              test: /node_modules[\\/](?:react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'data-client',
              test: /node_modules[\\/](?:@supabase|@tanstack)[\\/]/,
            },
            {
              name: 'forms',
              test: /node_modules[\\/](?:@hookform|react-hook-form|zod)[\\/]/,
            },
            {
              name: 'ui-utilities',
              test: /node_modules[\\/](?:date-fns|lucide-react)[\\/]/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
