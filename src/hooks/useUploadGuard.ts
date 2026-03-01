/**
 * useUploadGuard — Warns users before closing tab during active uploads (P1-C)
 * Also warns on slow connections before large uploads (P2-C)
 */

import { useEffect } from 'react';
import { hasActiveUploads } from '@/uploads/uploadPipeline';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { toast } from 'sonner';

/**
 * Adds a beforeunload handler that fires when uploads are active.
 * Mount this once at the app root (e.g., App.tsx).
 */
export function useUploadGuard() {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasActiveUploads()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Network quality warning for large uploads (P2-C)
  useEffect(() => {
    const unsub = uploadEventBus.on('upload:enqueued', (event: any) => {
      const connection = (navigator as any).connection;
      if (!connection) return;

      const isSlowConnection = connection.effectiveType === '2g' || connection.effectiveType === '3g';
      if (isSlowConnection && (event.fileCount || 0) > 0) {
        toast.warning('Slow connection detected — upload may take a while. WiFi recommended.', {
          duration: 6000,
        });
      }
    });

    return unsub;
  }, []);
}
