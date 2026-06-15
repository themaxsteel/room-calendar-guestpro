import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 5175,
    strictPort: false,
    // Proxy for demo-guestpro.html — forwards /gp-api/* to the GuestPro API
    // server-side so the browser never makes a cross-origin request.
    proxy: {
      '/gp-api': {
        target: 'https://core-api.guestpro.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gp-api/, ''),
      },
    },
  },
  plugins: [
    vue({
      customElement: true,
    }),
    dts({
      include: ['src/**/*.ts', 'src/**/*.d.ts'],
      exclude: ['src/**/*.ce.vue'],
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  // Inline process.env.NODE_ENV so the bundle has no dependency on `process`
  // (which may be undefined in non-webpack browser environments).
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    // Target ES2019 (Chrome 73+, Node 12+) — ensures async/await is transpiled
    // for compatibility with Vue CLI / webpack 4 projects (Vue 2 apps).
    target: 'es2019',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RoomCalendar',
      fileName: 'room-calendar',
    },
    rollupOptions: {
      // Vue must NOT be external — this is a self-contained Web Component.
      // Bundling Vue 3 runtime in ensures the custom element works regardless
      // of the host app's framework (Vue 2, React, vanilla JS, etc.).
    },
    cssCodeSplit: false,
  },
})
