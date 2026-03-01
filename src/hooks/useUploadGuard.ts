/**
 * useUploadGuard — Warns users before closing tab during active uploads (P1-C)
 * Also warns on slow connections before large uploads (P2-C)
 * Also cleans up stale uploading posts >24 hours old
 */

import { useEffect } from 'react';
import { hasActiveUploads } from '@/uploads/uploadPipeline';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { detectMedianBridge } from '@/uploads/medianBridge';

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

  // Stale upload cleanup — delete posts stuck in 'uploading' status >24 hours
  useEffect(() => {
    const cleanupStaleUploads = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: staleUploads } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'uploading')
          .lt('created_at', twentyFourHoursAgo);

        if (staleUploads && staleUploads.length > 0) {
          console.log(`[useUploadGuard] Found ${staleUploads.length} stale uploading posts, deleting`);
          for (const post of staleUploads) {
            await supabase.from('posts').delete().eq('id', post.id);
          }
        }
      } catch (err) {
        console.warn('[useUploadGuard] Stale upload cleanup error:', err);
      }
    };

    cleanupStaleUploads();
  }, []);

  // Log Median bridge capabilities for diagnostics
  useEffect(() => {
    const bridgeInfo = detectMedianBridge();
    if (bridgeInfo.isMedianApp) {
      console.log('[App] Running in Median native app:', bridgeInfo);
    }
  }, []);
}
