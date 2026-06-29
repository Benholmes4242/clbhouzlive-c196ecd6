/**
 * TEMPORARY DEBUG BUTTON — Phase 0 verification.
 * Exercises the NEW upload queue path without the composer being wired (Phase 1).
 * REMOVE before Phase 1 ships.
 */
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { toast } from 'sonner';

export function DebugQueueUploadButton() {
  if (!import.meta.env.DEV) return null;

  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor() as any;

  const handleClick = async () => {
    if (!user?.id) {
      toast.error('No user');
      return;
    }
    try {
      // Build a tiny 1x1 PNG file
      const blob = await (await fetch(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      )).blob();
      const file = new File([blob], `debug-${Date.now()}.png`, { type: 'image/png' });

      const actorType = activeActor?.type === 'business' ? 'business' : 'personal';
      const actorId = activeActor?.id ?? user.id;

      const jobId = enqueuePostUpload({
        actorType,
        actorId,
        userId: user.id,
        caption: 'DEBUG queue test',
        files: [file],
        visibility: 'anyone',
        // TEMP DEBUG: hold processing 45s for RLS verification. REMOVE after Phase 0 sign-off.
        __debugHold: true,
      } as any);
      console.log('[UPLOAD-DEBUG][new] enqueue returned jobId', jobId);
      toast.success(`Queue job ${jobId.slice(0, 6)}…`);
    } catch (e: any) {
      console.error('[UPLOAD-DEBUG][new] enqueue error', e);
      toast.error(e?.message ?? 'enqueue failed');
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
        right: 12,
        zIndex: 99999,
        padding: '8px 12px',
        borderRadius: 8,
        background: '#F7931E',
        color: '#0F172A',
        fontSize: 11,
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      DEBUG: test queue upload
    </button>
  );
}
