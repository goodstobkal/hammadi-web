import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // Routes come from includedRoutes() in src/main.ts, which reads the tool
    // catalog - so a new tool in the API becomes a prerendered page here.
    includedRoutes: undefined,
  },
  server: {
    port: 5173,
  },
})
