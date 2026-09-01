import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@dhanya/types': path.resolve(__dirname, '../packages/types/src/index.ts'),
      '@dhanya/finance-engine': path.resolve(__dirname, '../packages/finance-engine/src/index.ts'),
      '@dhanya/validation': path.resolve(__dirname, '../packages/validation/src/index.ts'),
      '@dhanya/config': path.resolve(__dirname, '../packages/config/src/index.ts'),
      '@dhanya/ui': path.resolve(__dirname, '../packages/ui/src/index.tsx'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      port: 24679,
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
