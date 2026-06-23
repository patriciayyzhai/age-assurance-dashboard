import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages builds set VITE_BASE_PATH to the repository path.
  base: process.env.VITE_BASE_PATH || '/',
})
