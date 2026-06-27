// DraftsListSheet — full-screen list of saved post drafts.
// Lives inside the PostComposer portal; rendered on top of the Chooser.
// Selecting a row opens the composer resuming that draft.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Image as ImageIcon, MapPin, Trash2, FileText, Play } from 'lucide-react';
import { toast } from 'sonner';
import { fetchUserDrafts, deleteDraft } from '@/services/drafts/draftService';
import type { DraftWithMedia } from '@/services/drafts/types';
import WatchEmptyState from '@/components/watch/shared/WatchEmptyState';

const INK = '#1C1C1E';
const INK_2 = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';
const SURFACE = '#FFFFFF';
const PAGE = '#F8FAFC';
const CHIP = '#F5F5F7';
const HAIR = 'rgba(15,23,42,0.07)';
const DANGER = '#DC2626';

const SWIPE_REVEAL = 96;
const SWIPE_TRIGGER = 64;
const TAP_SLOP = 8;

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

function sortByUpdated(list: DraftWithMedia[]): DraftWithMedia[] {
  return [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

interface DraftRowProps {
  draft: DraftWithMedia;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const DraftRow: React.FC<DraftRowProps> = ({ draft, onSelect, onDelete }) => {
  const d = draft;
  const fgRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const baseX = useRef(0);
  const dragX = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);

  const setTx = (x: number, animate = false) => {
    const el = fgRef.current;
    if (!el) return;
    el.style.transition = animate
      ? 'transform 200ms cubic-bezier(0.16,1,0.3,1)'
      : 'none';
    el.style.transform = `translate3d(${x}px,0,0)`;
    dragX.current = x;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return; // swipe is touch-only
    startX.current = e.clientX;
    startY.current = e.clientY;
    baseX.current = dragX.current;
    dragging.current = true;
    moved.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!moved.current && Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) return;
    // if vertical scroll dominates, abort swipe
    if (Math.abs(dy) > Math.abs(dx) && !moved.current) {
      dragging.current = false;
      return;
    }
    moved.current = true;
    const next = Math.min(0, Math.max(-SWIPE_REVEAL - 20, baseX.current + dx));
    setTx(next);
  };
  const finishDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragX.current < -SWIPE_TRIGGER) {
      setTx(-window.innerWidth, true);
      window.setTimeout(() => onDelete(d.id), 180);
    } else {
      setTx(0, true);
    }
  };
  const onPointerUp = () => finishDrag();
  const onPointerCancel = () => finishDrag();

  const handleClick = () => {
    if (moved.current || dragX.current !== 0) return;
    onSelect(d.id);
  };

  const pressDown = (e: React.PointerEvent) => {
    if (dragX.current !== 0) return;
    (e.currentTarget as HTMLDivElement).style.transform =
      `translate3d(${dragX.current}px,0,0) scale(0.99)`;
  };
  const pressUp = (e: React.PointerEvent) => {
    if (dragX.current !== 0) return;
    (e.currentTarget as HTMLDivElement).style.transform =
      `translate3d(${dragX.current}px,0,0) scale(1)`;
  };

  const firstMedia = d.media?.[0];
  const thumbUrl = firstMedia
    ? firstMedia.mediaType === 'video'
      ? firstMedia.posterUrl || undefined
      : firstMedia.mediaUrl
    : undefined;
  const isVideo = firstMedia?.mediaType === 'video';
  const courseName = d.courseData?.[0]?.name || d.courseName || null;
  const caption = (d.content ?? '').trim();

  // Title fallback: course name → media type → Untitled. Derived titles render italic+faint.
  let title = caption;
  let titleDerived = false;
  let suppressCourseChip = false;
  if (!title) {
    titleDerived = true;
    if (courseName) {
      title = courseName;
      suppressCourseChip = true;
    } else if (firstMedia) {
      title = isVideo ? 'Video draft' : 'Photo draft';
    } else {
      title = 'Untitled draft';
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Red delete affordance */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: DANGER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 22px',
          gap: 8,
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          borderRadius: 16,
        }}
        aria-hidden="true"
      >
        <Trash2 size={16} strokeWidth={2.25} />
        Delete
      </div>

      <div
        ref={fgRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(d.id);
          }
        }}
        onPointerDown={(e) => {
          onPointerDown(e);
          pressDown(e);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => {
          pressUp(e);
          onPointerUp();
        }}
        onPointerLeave={(e) => {
          pressUp(e);
          onPointerCancel();
        }}
        onPointerCancel={(e) => {
          pressUp(e);
          onPointerCancel();
        }}
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          gap: 12,
          padding: 12,
          border: `0.5px solid ${HAIR}`,
          borderRadius: 16,
          background: SURFACE,
          textAlign: 'left',
          cursor: 'pointer',
          alignItems: 'stretch',
          boxShadow:
            '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -8px rgba(15,23,42,0.08)',
          transition: 'transform 120ms ease, box-shadow 120ms ease',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'pan-y',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: 12,
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
              color: titleDerived ? INK_FAINT : INK_2,
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontStyle: titleDerived ? 'italic' : 'normal',
            }}
          >
            {title}
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
            {courseName && !suppressCourseChip && (
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
            onDelete(d.id);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            const el = e.currentTarget;
            el.style.transform = 'scale(0.94)';
            el.style.background = 'rgba(220,38,38,0.08)';
          }}
          onPointerUp={(e) => {
            const el = e.currentTarget;
            el.style.transform = 'scale(1)';
            el.style.background = 'transparent';
          }}
          onPointerLeave={(e) => {
            const el = e.currentTarget;
            el.style.transform = 'scale(1)';
            el.style.background = 'transparent';
          }}
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
            transition: 'transform 120ms ease, background 120ms ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

const DraftRowSkeleton: React.FC = () => (
  <div
    style={{
      width: '100%',
      display: 'flex',
      gap: 12,
      padding: 12,
      marginBottom: 8,
      border: `0.5px solid ${HAIR}`,
      borderRadius: 16,
      background: SURFACE,
      alignItems: 'stretch',
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        flexShrink: 0,
        borderRadius: 12,
        background: CHIP,
        animation: 'pulse 1.6s ease-in-out infinite',
      }}
    />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
      <div
        style={{
          width: '60%',
          height: 12,
          borderRadius: 6,
          background: CHIP,
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          width: '40%',
          height: 10,
          borderRadius: 6,
          background: CHIP,
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      />
    </div>
  </div>
);

export function DraftsListSheet({ open, onClose, onSelect }: DraftsListSheetProps) {
  const [drafts, setDrafts] = useState<DraftWithMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

  // Flush any pending deletes on unmount so closing the sheet doesn't orphan timers.
  useEffect(() => {
    const map = pendingDeletes.current;
    return () => {
      map.forEach((timer, id) => {
        clearTimeout(timer);
        void deleteDraft(id);
      });
      map.clear();
    };
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      const draft = drafts.find((d) => d.id === id);
      if (!draft) return;

      // Optimistic remove
      setDrafts((prev) => prev.filter((d) => d.id !== id));

      const timer = setTimeout(async () => {
        pendingDeletes.current.delete(id);
        const ok = await deleteDraft(id);
        if (!ok) {
          setDrafts((prev) => sortByUpdated([draft, ...prev]));
          toast.error("Couldn't delete draft");
        }
      }, 5000);
      pendingDeletes.current.set(id, timer);

      toast('Draft deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            const t = pendingDeletes.current.get(id);
            if (t) clearTimeout(t);
            pendingDeletes.current.delete(id);
            setDrafts((prev) => sortByUpdated([draft, ...prev]));
          },
        },
        duration: 5000,
      });
    },
    [drafts],
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
          onPointerDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.94)';
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onPointerLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
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
            transition: 'transform 120ms ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={18} color={INK_MUTE} strokeWidth={2} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: INK }}>
          Drafts
        </span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 12px 24px' }}>
        {loading && drafts.length === 0 ? (
          <>
            <DraftRowSkeleton />
            <DraftRowSkeleton />
            <DraftRowSkeleton />
          </>
        ) : drafts.length === 0 ? (
          <WatchEmptyState
            title="No drafts yet"
            message="Posts you save as drafts will show up here."
          />
        ) : (
          drafts.map((d) => (
            <DraftRow key={d.id} draft={d} onSelect={onSelect} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}

export default DraftsListSheet;
