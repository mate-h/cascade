import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import UnoCSS from '@unocss/svelte-scoped/vite'

export default defineConfig({
  plugins: [
    UnoCSS({
      injectReset: '@unocss/reset/normalize.css',
    }),
    svelte(),
  ],
}) 