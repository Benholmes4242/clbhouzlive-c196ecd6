import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';

// ONE id per build, shared by the __BUILD_ID__ define and the /build-id.json
// artefact. If these two ever diverge the staleness check misfires forever.
const BUILD_ID = Date.now().toString(36);

/**
 * Emits /build-id.json at a FIXED, UNHASHED path and serves it in dev.
 * Cache-Control: no-store is the whole mechanism — a cached build-id.json
 * inherits the exact staleness it exists to detect. See public/_headers for
 * the production header (this middleware covers dev/preview).
 */
function buildIdEndpoint(): Plugin {
  const body = JSON.stringify({ buildId: BUILD_ID }) + '\n';
  return {
    name: 'clbhouz-build-id-endpoint',
    configureServer(server) {
      server.middlewares.use('/build-id.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.end(body);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/build-id.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.end(body);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'build-id.json', source: body });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    // Cache-buster for the persisted React Query store (see src/lib/queryPersister.ts).
    // Every build produces a fresh id — schema changes wipe the persisted cache cleanly.
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    // Human-readable ISO stamp emitted at boot into consoleCapture, so every
    // copied LogHud capture identifies the build it was taken against.
    __BUILD_STAMP__: JSON.stringify(new Date().toISOString()),
  },

  base: '/',
  server: {
    host: true,
    port: 8080,
  },
  build: {
    // CRITICAL: Disable sourcemaps to prevent OOM with 6900+ modules
    sourcemap: false,
    target: 'esnext',
    minify: 'esbuild',
    // Reduce memory pressure during chunk rendering
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          // Core React - loaded first
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client
          'supabase': ['@supabase/supabase-js'],

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
    // Preserve function/class names through minification so the top-level
    // ErrorBoundary's componentStack shows real component names on device
    // (sourcemaps stay OFF — this is name preservation only, no OOM risk).
    keepNames: true,
    // Remove console.log in production (keep errors/warns)
    drop: mode === 'production' ? ['debugger'] : [],
    pure: mode === 'production' ? ['console.log', 'console.debug'] : [],
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', '@tanstack/react-query'],
  },
  worker: {
    format: 'es',
  },
  plugins: [
    react(),
    buildIdEndpoint(),
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
