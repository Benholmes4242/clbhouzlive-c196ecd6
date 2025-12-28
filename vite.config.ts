import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: true,
    port: 8080,
  },
  build: {
    sourcemap: mode === 'development',
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          // Core React - loaded first
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client
          'supabase': ['@supabase/supabase-js'],
          // HLS.js - lazy loaded when needed
          'hls': ['hls.js'],
          // UI components - radix primitives
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-avatar',
            '@radix-ui/react-slot',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
          ],
          // Query/state management
          'query': ['@tanstack/react-query'],
          // Animation
          'motion': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  esbuild: {
    // Remove console.log in production (keep errors/warns)
    drop: mode === 'production' ? ['debugger'] : [],
    pure: mode === 'production' ? ['console.log', 'console.debug'] : [],
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', '@tanstack/react-query', 'hls.js'],
  },
  worker: {
    format: 'es',
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && visualizer({ 
      filename: 'dist/stats.html', 
      template: 'treemap', 
      gzipSize: true, 
      brotliSize: true 
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
