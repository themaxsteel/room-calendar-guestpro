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
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RoomCalendar',
      fileName: 'room-calendar',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    cssCodeSplit: false,
  },
})
