// PendingPostCard — author-only optimistic card rendered above feeds while
// an upload is in flight. Mirrors the visual footprint of a real feed card
// closely enough to avoid layout shift on swap.

import React, { useCallback, useMemo, useState } from 'react';
import { Loader2, AlertCircle, X, RotateCcw } from 'lucide-react';
import { toast } from '@/lib/toast';
import { usePendingPostsStore, aggregatePendingProgress, type PendingPost } from '@/uploads/pendingPostsStore';
import { uploadManager } from '@/uploads/UploadManager';
import { retryJob, retryFailedItems, enqueuePostUpload, cancelJob } from '@/uploads/uploadPipeline';
import { reviewRetryRegistry } from '@/uploads/reviewRetryRegistry';
import { MentionText } from '@/components/mentions/MentionText';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface PendingPostCardProps {
  entry: PendingPost;
}

// Dark-only. The light palette was retired with the light profile surface —
// every host of this card (profile Posts tab, Videos feed) is now dark.
const DARK = {
  surface: A.PANEL,
  hairline: A.BORDER,
  text: A.INK,
  muted: A.MUTE,
  trackBg: 'rgba(255,255,255,0.08)',
  trackFill: '#F7931E',
  failed: '#F87171',
};

export const PendingPostCard: React.FC<PendingPostCardProps> = ({ entry }) => {
  const T = DARK;
  const removeJob = usePendingPostsStore((s) => s.removeJob);
  const [retrying, setRetrying] = useState(false);
  const isReview = entry.kind === 'review';

  const aggregate = useMemo(() => aggregatePendingProgress(entry), [entry]);
  const firstMedia = entry.media[0];

  const handleRetry = useCallback(async () => {
    if (retrying) return;

    // Offline guard — don't even try while offline; the auth check inside
    // the upload path would falsely surface "Not authenticated".
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      usePendingPostsStore
        .getState()
        .markFailed(entry.jobId, 'No connection - reconnect and try again');
      return;
    }

    setRetrying(true);

    // REVIEW BRANCH: never touches uploadManager / uploadPipeline. Retry
    // runs through the review pipeline's own primitive, registered under
    // the same jobId in reviewRetryRegistry.
    if (isReview) {
      try {
        const fn = reviewRetryRegistry.get(entry.jobId);
        if (!fn) {
          toast.error("Can't resume this upload", {
            description: 'Open the review and add the media again.',
          });
          removeJob(entry.jobId);
          return;
        }
        await fn();
      } catch (err) {
        console.error('[PendingPostCard] review retry failed:', err);
        toast.error("Couldn't retry", { description: (err as { message?: string } | null)?.message ?? 'Try again' });
      } finally {
        setRetrying(false);
      }
      return;
    }

    // Offline guard — don't even try while offline; the auth check inside
    // the upload path would falsely surface "Not authenticated".
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      usePendingPostsStore
        .getState()
        .markFailed(entry.jobId, 'No connection - reconnect and try again');
      return;
    }

    setRetrying(true);

    try {
      const job = uploadManager.getJob(entry.jobId);

      // Case 1: partial failure → resume only failed items.
      if (job?.partialFailure) {
        const ok = await retryFailedItems(entry.jobId);
        if (!ok) throw new Error('Resume failed');
        return;
      }

      // Case 2: UploadManager still has the failed job → in-place retry.
      if (job && job.files && job.files.length > 0) {
        const ok = retryJob(entry.jobId);
        if (ok) return;
      }

      // Case 3: full re-enqueue from the pending entry's stored data.
      if (!entry.files || entry.files.length === 0) {
        toast.error('Upload data is no longer available', {
          description: 'Please create the post again',
        });
        removeJob(entry.jobId);
        return;
      }

      enqueuePostUpload({
        userId: entry.userId,
        actorType: entry.actorType,
        actorId: entry.actorId,
        caption: entry.caption,
        files: entry.files,
        courseInfo: entry.courseId && entry.courseName
          ? { id: entry.courseId, name: entry.courseName, country: '' }
          : undefined,
        courseIds: entry.courseId ? [entry.courseId] : undefined,
        mediaItems: entry.media.map((m) => ({
          id: m.id,
          type: m.kind,
        })),
      });

      // Drop the old (dead-jobId) pending entry; the fresh enqueue created
      // its own. The fresh entry will be added by the composer-side path
      // OR can be re-added here — but for simplicity we let the user see
      // the new card via UploadProgressBanner if they re-enqueue manually.
      removeJob(entry.jobId);
    } catch (err) {
      console.error('[PendingPostCard] retry failed:', err);
      toast.error("Couldn't retry", { description: (err as { message?: string } | null)?.message ?? 'Try again' });
    } finally {
      setRetrying(false);
    }
  }, [entry, isReview, removeJob, retrying]);

  const handleDismiss = useCallback(async () => {
    // Review branch: pipeline manages its own File refs and any DB rows
    // for items that DID upload are legitimately attached to the review.
    // We just drop the visibility card.
    if (isReview) {
      removeJob(entry.jobId);
      return;
    }
    try {
      await cancelJob(entry.jobId);
    } catch {
      // ignore
    }
    removeJob(entry.jobId);
  }, [entry.jobId, isReview, removeJob]);

  return (
    <div
      style={{
        background: T.surface,
        borderBottom: `0.5px solid ${T.hairline}`,
        padding: '12px 16px',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            overflow: 'hidden',
            background: T.trackBg,
            flexShrink: 0,
          }}
        >
          {entry.authorAvatarUrl && (
            <img
              src={entry.authorAvatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Header + body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
              {entry.authorName || 'You'}
            </span>
            <span style={{ fontSize: 12, color: T.muted }}>·</span>
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>
              {isReview
                ? (entry.status === 'failed'
                    ? 'Review · Upload failed'
                    : entry.status === 'queued'
                      ? 'Review · Queued'
                      : 'Review · Posting…')
                : (entry.status === 'failed'
                    ? 'Upload failed'
                    : entry.status === 'queued'
                      ? 'Queued'
                      : 'Posting…')}
            </span>
          </div>

          {entry.caption && (
            <MentionText
              text={entry.caption}
              as="p"
              style={{
                margin: '6px 0 0',
                fontSize: 14,
                color: T.text,
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            />
          )}

          {/* Media preview thumb row */}
          {entry.media.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {entry.media.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: T.trackBg,
                    position: 'relative',
                  }}
                >
                  {m.kind === 'video' ? (
                    // [VIDEO-TEARDOWN-OUT-OF-SCOPE] Local upload-preview poster-frame, not streaming playback.
                    <video
                      src={`${m.previewUrl}#t=0.1`}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={m.previewUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  {m.kind === 'video' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.25)',
                      }}
                    />
                  )}
                </div>
              ))}
              {entry.media.length > 4 && (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    background: T.trackBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.muted,
                  }}
                >
                  +{entry.media.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Progress / status row */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            {entry.status === 'failed' ? (
              <>
                <AlertCircle size={14} style={{ color: T.failed, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: T.failed, fontWeight: 500 }}>
                  {entry.error || 'Upload failed'}
                </span>
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.text,
                    background: T.trackBg,
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    opacity: retrying ? 0.6 : 1,
                  }}
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
                <button
                  onClick={handleDismiss}
                  aria-label="Dismiss"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    background: 'transparent',
                    border: 'none',
                    color: T.muted,
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <Loader2 size={14} style={{ color: T.trackFill, flexShrink: 0 }} className="animate-spin" />
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 999,
                    background: T.trackBg,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${aggregate}%`,
                      height: '100%',
                      background: T.trackFill,
                      transition: 'width 250ms ease-out',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: T.muted, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
                  {aggregate}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPostCard;
