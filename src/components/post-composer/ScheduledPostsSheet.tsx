// ScheduledPostsSheet — full-screen list of scheduled (+ failed) posts.
// Lives inside the PostComposer portal; rendered on top of the Chooser.
//
// Each row shows the local scheduled time, a media/caption preview, and the
// per-status actions:
//   - status='scheduled' → Reschedule · Publish now · Cancel
//   - status='failed'    → Retry (reschedule) · Publish now · Delete
//                          + a red "Failed to publish" banner so the user
//                          notices and can recover. Failed posts must never
//                          be silently hidden.

import React, { useCallback, useState } from 'react';
import {
  X,
  Image as ImageIcon,
  MapPin,
  Trash2,
  FileText,
  Play,
  Clock,
  CalendarClock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useScheduledPosts, type ScheduledPost } from '@/hooks/useScheduledPosts';
import { ScheduleSheet } from './ScheduleSheet';

const INK = '#1C1C1E';
const INK_2 = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';
const SURFACE = '#FFFFFF';
const PAGE = '#F8FAFC';
const CHIP = '#F5F5F7';
const HAIR = 'rgba(15,23,42,0.07)';
const DANGER = '#DC2626';
const DANGER_BG = '#FEF2F2';
const DANGER_BORDER = 'rgba(220,38,38,0.22)';

interface ScheduledPostsSheetProps {
  open: boolean;
  onClose: () => void;
}

function formatLocal(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ScheduledPostsSheet({ open, onClose }: ScheduledPostsSheetProps) {
  const {
    scheduledPosts,
    isLoading,
    reschedule,
    publishNow,
    deletePost,
    isPublishing,
    isDeleting,
    isRescheduling,
  } = useScheduledPosts();

  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledPost | null>(null);

  const handlePublishNow = useCallback(
    async (id: string) => {
      if (!confirm('Publish this post now?')) return;
      await publishNow(id);
    },
    [publishNow]
  );

  const handleDelete = useCallback(
    async (id: string, isFailed: boolean) => {
      const msg = isFailed
        ? 'Delete this failed post permanently?'
        : 'Cancel this scheduled post?';
      if (!confirm(msg)) return;
      await deletePost(id);
    },
    [deletePost]
  );

  const handleConfirmReschedule = useCallback(
    async (when: Date) => {
      if (!rescheduleTarget) return;
      await reschedule(rescheduleTarget.id, when);
      setRescheduleTarget(null);
    },
    [rescheduleTarget, reschedule]
  );

  if (!open) return null;

  const failedCount = scheduledPosts.filter((p) => p.status === 'failed').length;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: PAGE,
        zIndex: 6,
        display: 'flex',
        flexDirection: 'column',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: `0.5px solid ${HAIR}`,
          background: PAGE,
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close scheduled"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: CHIP,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} color={INK_MUTE} strokeWidth={2} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: INK }}>
          Scheduled
        </span>
        <div style={{ width: 36 }} />
      </div>

      {failedCount > 0 && (
        <div
          style={{
            margin: '12px 12px 0',
            padding: '10px 12px',
            background: DANGER_BG,
            border: `1px solid ${DANGER_BORDER}`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertTriangle size={16} color={DANGER} strokeWidth={2.25} />
          <div style={{ fontSize: 12.5, color: DANGER, fontWeight: 700 }}>
            {failedCount} post{failedCount === 1 ? '' : 's'} failed to publish — retry or delete below.
          </div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px 12px 24px',
        }}
      >
        {isLoading && scheduledPosts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: INK_MUTE, fontSize: 13 }}>
            Loading…
          </div>
        ) : scheduledPosts.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: INK_MUTE,
              fontSize: 13,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CalendarClock size={28} color={INK_FAINT} strokeWidth={1.75} />
            <div>No scheduled posts.</div>
            <div style={{ fontSize: 12, color: INK_FAINT }}>
              Tap the clock next to “Post” to schedule for later.
            </div>
          </div>
        ) : (
          scheduledPosts.map((post) => {
            const isFailed = post.status === 'failed';
            const firstMedia = post.media?.[0];
            const thumbUrl = firstMedia
              ? firstMedia.mediaType === 'video'
                ? firstMedia.posterUrl || undefined
                : firstMedia.mediaUrl
              : undefined;
            const isVideo = firstMedia?.mediaType === 'video';
            const caption = (post.content ?? '').trim();
            const captionPreview = caption || 'No caption';
            const busyThis =
              (isPublishing || isDeleting || isRescheduling) && false; // global, not per-row
            return (
              <div
                key={post.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  marginBottom: 10,
                  border: `1px solid ${isFailed ? DANGER_BORDER : HAIR}`,
                  borderRadius: 14,
                  background: SURFACE,
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      borderRadius: 10,
                      background: CHIP,
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FileText size={22} color={INK_FAINT} strokeWidth={1.75} />
                    )}
                    {isVideo && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Play size={18} color="#fff" fill="#fff" />
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: isFailed ? DANGER : INK_MUTE,
                      }}
                    >
                      {isFailed ? (
                        <>
                          <AlertTriangle size={12} strokeWidth={2.25} />
                          Failed to publish
                        </>
                      ) : (
                        <>
                          <Clock size={12} strokeWidth={2.25} />
                          {formatLocal(post.scheduledAt)}
                        </>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: caption ? INK_2 : INK_FAINT,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontStyle: caption ? 'normal' : 'italic',
                      }}
                    >
                      {captionPreview}
                    </div>
                    {isFailed && post.scheduledAt && (
                      <div style={{ fontSize: 11, color: INK_MUTE }}>
                        was scheduled for {formatLocal(post.scheduledAt)}
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 11.5,
                        color: INK_MUTE,
                        flexWrap: 'wrap',
                      }}
                    >
                      {post.media && post.media.length > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <ImageIcon size={11} strokeWidth={2} />
                          {post.media.length}
                        </span>
                      )}
                      {post.courseId && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} strokeWidth={2} />
                          course tagged
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    paddingTop: 4,
                    borderTop: `0.5px solid ${HAIR}`,
                    marginTop: 2,
                  }}
                >
                  <button
                    onClick={() => setRescheduleTarget(post)}
                    disabled={busyThis}
                    style={pillButtonStyle({
                      filled: isFailed,
                      tone: isFailed ? 'danger' : 'default',
                    })}
                  >
                    {isFailed ? (
                      <>
                        <RotateCcw size={12} strokeWidth={2.5} />
                        Retry
                      </>
                    ) : (
                      <>
                        <CalendarClock size={12} strokeWidth={2.5} />
                        Reschedule
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handlePublishNow(post.id)}
                    disabled={busyThis}
                    style={pillButtonStyle({ filled: !isFailed, tone: 'default' })}
                  >
                    <Play size={12} strokeWidth={2.5} />
                    Publish now
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => handleDelete(post.id, isFailed)}
                    disabled={busyThis}
                    aria-label={isFailed ? 'Delete' : 'Cancel'}
                    style={{
                      ...pillButtonStyle({ filled: false, tone: 'default' }),
                      color: INK_MUTE,
                    }}
                  >
                    <Trash2 size={12} strokeWidth={2.5} />
                    {isFailed ? 'Delete' : 'Cancel'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ScheduleSheet
        open={!!rescheduleTarget}
        initialValue={rescheduleTarget ? new Date(rescheduleTarget.scheduledAt) : null}
        busy={isRescheduling}
        title={rescheduleTarget?.status === 'failed' ? 'Retry post' : 'Reschedule post'}
        confirmLabel={rescheduleTarget?.status === 'failed' ? 'Retry' : 'Reschedule'}
        onCancel={() => setRescheduleTarget(null)}
        onConfirm={handleConfirmReschedule}
      />
    </div>
  );
}

function pillButtonStyle({
  filled,
  tone,
}: {
  filled: boolean;
  tone: 'default' | 'danger';
}): React.CSSProperties {
  const bg = filled ? (tone === 'danger' ? DANGER : INK_2) : SURFACE;
  const color = filled ? '#fff' : INK_2;
  const border = filled ? 'none' : `1px solid ${HAIR}`;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '7px 11px',
    borderRadius: 999,
    border,
    background: bg,
    color,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  };
}

export default ScheduledPostsSheet;
