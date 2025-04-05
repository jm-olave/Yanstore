import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env files based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    // Vite config
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      open: true,
      host: true,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // Different settings based on mode
      ...(mode === 'production' && {
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: false,
            drop_debugger: true,
          },
        },
      }),
    },
    // Make env variables available to the app
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})
