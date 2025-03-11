import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [ solid(), tailwindcss() ],
  build: { /* target: "ES2019" */ },
  esbuild: { /* target: "ES2019" */ }
})
