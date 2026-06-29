import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ◄--- ADD THIS IMPORT

// https://vite.js.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // ◄--- INJECT TAILWIND INTO THE VITE COMPILER PIPELINE
  ],
})