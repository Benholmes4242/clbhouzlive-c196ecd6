// DraftsListSheet — full-screen list of saved post drafts.
// Lives inside the PostComposer portal; rendered on top of the Chooser.
// Selecting a row opens the composer resuming that draft.

import React, { useCallback, useEffect, useState } from 'react';
import { X, Image as ImageIcon, MapPin, Trash2, FileText, Play } from 'lucide-react';
import { toast } from 'sonner';
import { fetchUserDrafts, deleteDraft } from '@/services/drafts/draftService';
import type { DraftWithMedia } from '@/services/drafts/types';

const INK = '#1C1C1E';
const INK_2 = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';
const SURFACE = '#FFFFFF';
const PAGE = '#F8FAFC';
const CHIP = '#F5F5F7';
const HAIR = 'rgba(15,23,42,0.07)';

interface DraftsListSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (draftId: string) => void;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function DraftsListSheet({ open, onClose, onSelect }: DraftsListSheetProps) {
  const [drafts, setDrafts] = useState<DraftWithMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchUserDrafts();
      setDrafts(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('Delete this draft?')) return;
      setBusyId(id);
      const ok = await deleteDraft(id);
      setBusyId(null);
      if (ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        toast.success('Draft deleted');
      } else {
        toast.error("Couldn't delete draft");
      }
    },
    [],
  );

  if (!open) return null;

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
      {/* Header */}
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
          aria-label="Close drafts"
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
          Drafts
        </span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 12px 24px' }}>
        {loading && drafts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: INK_MUTE, fontSize: 13 }}>
            Loading…
          </div>
        ) : drafts.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: INK_MUTE, fontSize: 13 }}>
            No drafts saved.
          </div>
        ) : (
          drafts.map((d) => {
            const firstMedia = d.media?.[0];
            const thumbUrl = firstMedia
              ? firstMedia.mediaType === 'video'
                ? firstMedia.posterUrl || undefined
                : firstMedia.mediaUrl
              : undefined;
            const isVideo = firstMedia?.mediaType === 'video';
            const courseName =
              d.courseData?.[0]?.name || d.courseName || null;
            const caption = (d.content ?? '').trim();
            const captionPreview = caption || 'No caption';
            return (
              <button
                key={d.id}
                onClick={() => onSelect(d.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  marginBottom: 8,
                  border: `1px solid ${HAIR}`,
                  borderRadius: 14,
                  background: SURFACE,
                  textAlign: 'left',
                  cursor: 'pointer',
                  alignItems: 'stretch',
                }}
              >
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

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div
                    style={{
                      fontSize: 14,
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
                    {courseName && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={11} strokeWidth={2} />
                        {courseName}
                      </span>
                    )}
                    {d.media && d.media.length > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <ImageIcon size={11} strokeWidth={2} />
                        {d.media.length}
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto' }}>edited {relativeTime(d.updatedAt)}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(d.id);
                  }}
                  disabled={busyId === d.id}
                  aria-label="Delete draft"
                  style={{
                    width: 32,
                    height: 32,
                    alignSelf: 'center',
                    borderRadius: 8,
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: INK_FAINT,
                    opacity: busyId === d.id ? 0.4 : 1,
                  }}
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DraftsListSheet;
