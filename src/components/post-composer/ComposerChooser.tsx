// ComposerChooser — entry screen: Create a post / Review a course.
// Shows a "Drafts (N)" tile when the user has saved drafts and a
// "Scheduled (N)" tile when scheduled or failed posts exist.

import React, { useEffect, useState } from 'react';
import { X, Camera, Star, ChevronRight, FileText, CalendarClock, AlertTriangle } from 'lucide-react';
import { getDraftCount } from '@/services/drafts/draftService';
import { getScheduledPostCount, getFailedPostCount } from '@/services/posts/scheduledPosts';

const INK = '#1C1C1E';
const INK_2 = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';
const SURFACE = '#FFFFFF';
const PAGE = '#F8FAFC';
const CHIP = '#F5F5F7';
const HAIR = 'rgba(15,23,42,0.07)';
const DANGER = '#DC2626';

type TileTone = 'amber' | 'violet' | 'slate' | 'danger';

const TILE_TONES: Record<TileTone, { bg: string; grad: string; icon: string; ring: string }> = {
  amber:  { bg: '#FEF3E7', grad: 'linear-gradient(180deg,#FEF6EC 0%,#FCEAD6 100%)', icon: '#D97706', ring: 'rgba(217,119,6,0.16)' },
  violet: { bg: '#F1ECFE', grad: 'linear-gradient(180deg,#F4EFFE 0%,#EBE2FC 100%)', icon: '#7C5CE6', ring: 'rgba(124,92,230,0.16)' },
  slate:  { bg: '#EEF2F7', grad: 'linear-gradient(180deg,#F2F5F9 0%,#E6ECF3 100%)', icon: '#64748B', ring: 'rgba(100,116,139,0.16)' },
  danger: { bg: '#FEF2F2', grad: 'linear-gradient(180deg,#FEF4F4 0%,#FCE6E6 100%)', icon: '#DC2626', ring: 'rgba(220,38,38,0.18)' },
};

// Inject the entrance keyframe once, module-scope.
if (typeof document !== 'undefined' && !document.getElementById('chooser-rise-kf')) {
  const s = document.createElement('style');
  s.id = 'chooser-rise-kf';
  s.textContent = `@keyframes chooserRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.chooser-rise{animation:none!important}}`;
  document.head.appendChild(s);
}

interface ComposerChooserProps {
  onClose: () => void;
  onPost: () => void;
  onReview: () => void;
  onOpenDrafts?: () => void;
  onOpenScheduled?: () => void;
  isBusiness: boolean;
}

export function ComposerChooser({
  onClose,
  onPost,
  onReview,
  onOpenDrafts,
  onOpenScheduled,
  isBusiness,
}: ComposerChooserProps) {
  const [draftCount, setDraftCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDraftCount().then((n) => !cancelled && setDraftCount(n)).catch(() => {});
    getScheduledPostCount().then((n) => !cancelled && setScheduledCount(n)).catch(() => {});
    getFailedPostCount().then((n) => !cancelled && setFailedCount(n)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pressDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.985)';
    e.currentTarget.style.background = '#FBFCFE';
  };
  const pressUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.background = SURFACE;
  };
  const pressHandlers = {
    onPointerDown: pressDown,
    onPointerUp: pressUp,
    onPointerLeave: pressUp,
    onPointerCancel: pressUp,
  };

  const closeDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.94)';
  };
  const closeUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  const scheduledTone: TileTone = failedCount > 0 ? 'danger' : 'amber';

  return (
    <div style={{ background: PAGE, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
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
          onPointerDown={closeDown}
          onPointerUp={closeUp}
          onPointerLeave={closeUp}
          onPointerCancel={closeUp}
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
          aria-label="Close"
        >
          <X size={18} color={INK_MUTE} strokeWidth={2} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: INK }}>
          Create
        </span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div
          className="chooser-rise"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: INK_2,
            marginBottom: 4,
            letterSpacing: '-0.02em',
            animation: 'chooserRise 460ms cubic-bezier(0.16,1,0.3,1) both',
            animationDelay: '0ms',
          }}
        >
          What would you like to do?
        </div>
        <div
          className="chooser-rise"
          style={{
            fontSize: 13,
            color: INK_MUTE,
            marginBottom: 18,
            letterSpacing: '-0.005em',
            lineHeight: 1.4,
            animation: 'chooserRise 460ms cubic-bezier(0.16,1,0.3,1) both',
            animationDelay: '20ms',
          }}
        >
          Share a moment, or review a course you've played.
        </div>

        <button
          onClick={onPost}
          className="chooser-rise"
          style={{ ...cardStyle(), animation: 'chooserRise 460ms cubic-bezier(0.16,1,0.3,1) both', animationDelay: '40ms' }}
          {...pressHandlers}
        >
          <div style={iconTileStyle('amber')}>
            <Camera size={24} color={TILE_TONES.amber.icon} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 650, color: INK_2, letterSpacing: '-0.01em' }}>Create a post</div>
            <div style={{ fontSize: 12, color: INK_MUTE, marginTop: 1 }}>
              Photos, video, or a thought
            </div>
          </div>
          <ChevronRight size={18} color={INK_FAINT} />
        </button>

        {isBusiness ? (
          <div
            className="chooser-rise"
            aria-disabled
            style={{
              ...cardStyle(),
              cursor: 'default',
              animation: 'chooserRise 460ms cubic-bezier(0.16,1,0.3,1) both',
              animationDelay: '90ms',
            }}
          >
            <div style={iconTileStyle('slate')}>
              <Star size={24} color={TILE_TONES.slate.icon} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 650, color: INK_2, letterSpacing: '-0.01em' }}>Review a course</div>
              <div style={{ fontSize: 12, color: INK_MUTE, marginTop: 1 }}>
                Reviews are personal
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: INK_FAINT,
                background: CHIP,
                padding: '3px 8px',
                borderRadius: 999,
              }}
            >
              Personal only
            </span>
          </div>
        ) : (
          <button
            onClick={onReview}
            className="chooser-rise"
            style={{ ...cardStyle(), animation: 'chooserRise 460ms cubic-bezier(0.16,1,0.3,1) both', animationDelay: '90ms' }}
            {...pressHandlers}
          >
            <div style={iconTileStyle('violet')}>
              <Star size={24} color={TILE_TONES.violet.icon} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 650, color: INK_2, letterSpacing: '-0.01em' }}>Review a course</div>
              <div style={{ fontSize: 12, color: INK_MUTE, marginTop: 1 }}>
                Rate & share your verdict
              </div>
            </div>
            <ChevronRight size={18} color={INK_FAINT} />
          </button>
        )}

        {draftCount > 0 && onOpenDrafts && (
          <button
            onClick={onOpenDrafts}
            className="chooser-rise"
            style={{ ...cardStyle(), animation: 'chooserRise 460ms cubic-bezier(0.16,1,0.3,1) both', animationDelay: '140ms' }}
            {...pressHandlers}
          >
            <div style={iconTileStyle('slate')}>
              <FileText size={22} color={TILE_TONES.slate.icon} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 650, color: INK_2, letterSpacing: '-0.01em' }}>
                Drafts <span style={{ color: INK_MUTE, fontWeight: 700 }}>({draftCount})</span>
              </div>
              <div style={{ fontSize: 12, color: INK_MUTE, marginTop: 1 }}>
                Pick up where you left off
              </div>
            </div>
            <ChevronRight size={18} color={INK_FAINT} />
          </button>
        )}

        {scheduledCount > 0 && onOpenScheduled && (
          <button
            onClick={onOpenScheduled}
            className="chooser-rise"
            style={{ ...cardStyle(), animation: 'chooserRise 460ms cubic-bezier(0.16,1,0.3,1) both', animationDelay: '190ms' }}
            {...pressHandlers}
          >
            <div style={iconTileStyle(scheduledTone)}>
              {failedCount > 0 ? (
                <AlertTriangle size={22} color={TILE_TONES.danger.icon} strokeWidth={2} />
              ) : (
                <CalendarClock size={22} color={TILE_TONES.amber.icon} strokeWidth={2} />
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 650, color: INK_2, letterSpacing: '-0.01em' }}>
                Scheduled{' '}
                <span style={{ color: INK_MUTE, fontWeight: 700 }}>({scheduledCount})</span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: failedCount > 0 ? DANGER : INK_MUTE,
                  marginTop: 1,
                  fontWeight: failedCount > 0 ? 700 : 400,
                }}
              >
                {failedCount > 0
                  ? `${failedCount} failed – tap to retry`
                  : 'Queued for later'}
              </div>
            </div>
            <ChevronRight size={18} color={INK_FAINT} />
          </button>
        )}
      </div>
    </div>
  );
}

function cardStyle(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: 16,
    borderRadius: 16,
    border: `0.5px solid ${HAIR}`,
    background: SURFACE,
    marginBottom: 12,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -8px rgba(15,23,42,0.08)',
    transition: 'transform 120ms ease, background 120ms ease, box-shadow 120ms ease',
    WebkitTapHighlightColor: 'transparent',
  };
}

function iconTileStyle(tone: TileTone = 'amber'): React.CSSProperties {
  const t = TILE_TONES[tone];
  return {
    width: 46,
    height: 46,
    borderRadius: 13,
    background: t.grad,
    boxShadow: `inset 0 0 0 1px ${t.ring}, inset 0 1px 0 rgba(255,255,255,0.6)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

export default ComposerChooser;
