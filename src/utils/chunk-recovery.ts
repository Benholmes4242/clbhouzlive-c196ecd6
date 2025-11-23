// Runtime safety net to prevent permanent blank screens from chunk loading errors
let triedReload = false;

// Prevent unhandled promise rejections from crashing iOS Safari
window.addEventListener('unhandledrejection', (event) => {
  // Log but don't crash
  console.warn('[Unhandled Rejection]', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (e) => {
  const msg = String((e && (e as any).message) || '');
  if (!triedReload && (
      msg.includes('ChunkLoadError') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Failed to fetch dynamically imported module'))) {
    triedReload = true;
    console.log('[Chunk Recovery] Detected chunk loading error, clearing caches and reloading...');
    
    (async () => {
      try {
        // Unregister all service workers
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        
        // Clear all caches
        if (window.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch (error) {
        console.error('[Chunk Recovery] Error clearing caches:', error);
      } finally {
        location.reload();
      }
    })();
  }
}, true);