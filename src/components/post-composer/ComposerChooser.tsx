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
const AMBER_SOFT = '#FEF3E7';
const GOLD_DEEP = '#D97706';
const DANGER = '#DC2626';

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
          aria-label="Close"
        >
          <X size={18} color={INK_MUTE} strokeWidth={2} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: INK }}>
          Create
        </span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: INK_2, marginBottom: 4 }}>
          What would you like to do?
        </div>
        <div style={{ fontSize: 13, color: INK_MUTE, marginBottom: 18 }}>
          Share a moment, or review a course you've played.
        </div>

        <button onClick={onPost} style={cardStyle()}>
          <div style={iconTileStyle()}>
            <Camera size={24} color={GOLD_DEEP} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK_2 }}>Create a post</div>
            <div style={{ fontSize: 12, color: INK_MUTE, marginTop: 1 }}>
              Photos, video, or a thought
            </div>
          </div>
          <ChevronRight size={18} color={INK_FAINT} />
        </button>

        <button
          onClick={isBusiness ? undefined : onReview}
          disabled={isBusiness}
          style={{
            ...cardStyle(),
            opacity: isBusiness ? 0.5 : 1,
            cursor: isBusiness ? 'not-allowed' : 'pointer',
          }}
        >
          <div style={iconTileStyle()}>
            <Star size={24} color={GOLD_DEEP} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK_2 }}>Review a course</div>
            <div style={{ fontSize: 12, color: INK_MUTE, marginTop: 1 }}>
              {isBusiness ? 'Reviews are personal' : 'Rate & share your verdict'}
            </div>
          </div>
          {!isBusiness && <ChevronRight size={18} color={INK_FAINT} />}
        </button>

        {draftCount > 0 && onOpenDrafts && (
          <button onClick={onOpenDrafts} style={cardStyle()}>
            <div style={iconTileStyle()}>
              <FileText size={22} color={GOLD_DEEP} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: INK_2 }}>
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
          <button onClick={onOpenScheduled} style={cardStyle()}>
            <div
              style={{
                ...iconTileStyle(),
                background: failedCount > 0 ? '#FEF2F2' : AMBER_SOFT,
              }}
            >
              {failedCount > 0 ? (
                <AlertTriangle size={22} color={DANGER} strokeWidth={2} />
              ) : (
                <CalendarClock size={22} color={GOLD_DEEP} strokeWidth={2} />
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: INK_2 }}>
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
                  ? `${failedCount} failed — tap to retry`
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
    borderRadius: 14,
    border: `1px solid ${HAIR}`,
    background: SURFACE,
    marginBottom: 12,
    cursor: 'pointer',
  };
}

function iconTileStyle(): React.CSSProperties {
  return {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: AMBER_SOFT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

export default ComposerChooser;
