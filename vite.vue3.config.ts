/**
 * Vue 3 host build — Vue is NOT bundled.
 *
 * Use this output when the host app is already Vue 3. The host's own Vue 3
 * runtime is reused, avoiding a duplicate copy (~40 kB gzip saved).
 *
 * Output files:
 *   dist/room-calendar.vue3.js       — ESM  (for bundlers: Vite, webpack 5)
 *   dist/room-calendar.vue3.umd.cjs  — UMD  (for plain <script> with Vue 3 loaded globally first)
 *
 * Usage (bundler):
 *   import { register } from 'room-calendar-guestpro/vue3'
 *   register()
 *
 * Usage (plain script):
 *   <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
 *   <script src="room-calendar.vue3.umd.cjs"></script>
 *   <script>RoomCalendarVue3.register()</script>
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue({ customElement: true }),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'es2019',
    outDir: 'dist',
    emptyOutDir: false, // do not wipe the main build output
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RoomCalendarVue3',
      fileName: 'room-calendar.vue3',
    },
    rollupOptions: {
      // Vue is external — provided by the host Vue 3 app.
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
    cssCodeSplit: false,
  },
})
