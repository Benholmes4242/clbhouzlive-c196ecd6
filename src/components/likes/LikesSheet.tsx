/**
 * LikesSheet — the full list of who liked something.
 *
 * TITLE IS "Likes", NOT "Liked this post": a round can be hearted from a
 * Discover tile when no post exists at all, and the same round in the feed
 * shares that ONE list. The title has to describe the likes, not the post.
 *
 * Business actors appear on round posts (a permanent exception — content_reactions
 * has no actor columns, so business likes stay in post_likes). They have no
 * handicap, so their row shows the business type instead. No empty handicap line.
 *
 * Read and presentation only. No like write path here.
 *
 * PAGINATION: renders 30 rows, pages on scroll.
 */
import { useTranslation } from 'react-i18next';
import type { ReactionKind } from '@/lib/reactionKind';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { LIKES_SHEET_Z } from '@/lib/zLayers';
import { formatHcp } from '@/lib/formatHcp';
import { usePostLikers } from '@/hooks/usePostLikers';
import type { LikeSource } from '@/hooks/usePostLikes';

const PAGE = 30;

function businessTypeLabel(type: string | null): string {
  if (!type) return 'Business';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface LikesSheetProps {
  open: boolean;
  onClose: () => void;
  postId: string | null;
  /** The surface's own like count — never the list length. */
  count: number;
  source?: LikeSource;
  kind?: ReactionKind;
}

export function LikesSheet({ open, onClose, postId, count, source = 'post', kind = 'like' }: LikesSheetProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { likers, isLoading } = usePostLikers(postId, open, source);
  const [visible, setVisible] = useState(PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setVisible(PAGE);
  }, [open, postId]);

  const rows = useMemo(() => likers.slice(0, visible), [likers, visible]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      setVisible((v) => (v < likers.length ? v + PAGE : v));
    }
  };

  const { user } = useSupabaseSession();

  /* TWO GROUPS over usePostLikers' existing followed-first order — never
     re-sorted here. An empty group renders nothing (no eyebrow). */
  const followed = rows.filter((l) => l.isFollowing);
  const others = rows.filter((l) => !l.isFollowing);

  const renderRow = (l: (typeof rows)[number], i: number) => {
    const isBusiness = l.actorType === 'business';
    const actorId = l.actorId ?? l.userId;
    const isViewer = !isBusiness && !!user?.id && actorId === user.id;
    return (
      <button
        key={`${l.actorType ?? 'personal'}:${actorId}`}
        type="button"
        onClick={() => {
          onClose();
          if (isBusiness) {
            if (l.username) navigate(`/business/${l.actorId ?? l.userId}`);
          } else if (l.username) {
            navigate(`/profile/${l.username}`);
          }
        }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
        }}
      >
        {/* Inset rule from 68px so the avatar column is unbroken; none above a group's first row. */}
        {i > 0 && (
          <span aria-hidden style={{ position: 'absolute', top: 0, left: 68, right: 0, height: 1, background: A.SOFT }} />
        )}
        <SquircleAvatar
          size={40}
          src={l.avatarUrl}
          alt={l.displayName}
          userId={isBusiness ? null : actorId}
          hairlineRing
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: '-0.1px',
              /* Amber = the viewer, and nothing else on this surface. */
              color: isViewer ? A.AMBER : A.INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {l.displayName || l.username}
            {isViewer ? ' · You' : null}
          </div>
          {isBusiness ? (
            <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM, marginTop: 5 }}>
              {businessTypeLabel(l.businessType)}
            </span>
          ) : l.handicapIndex !== null ? (
            /* CircleShelf grammar: label then figure. Withheld and absent both land here as null → no line. */
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.DIM }}>HCP</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.1px', color: A.MUTE, fontVariantNumeric: 'tabular-nums' }}>
                {formatHcp(l.handicapIndex)}
              </span>
            </div>
          ) : null}
        </div>
        <ChevronRight size={16} color={A.DIM} aria-hidden style={{ flexShrink: 0 }} />
      </button>
    );
  };

  const eyebrow = (label: string) => (
    <div style={{ padding: '14px 16px 7px', fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM }}>
      {label}
    </div>
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      zIndexBase={LIKES_SHEET_Z}
      maxHeight="85dvh"
    >
      <div style={{ padding: '4px 16px 12px', borderBottom: `1px solid ${A.BORDER}` }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: A.INK, letterSpacing: '-0.4px' }}>
          {kind === 'celebrate' ? t('reactions.sheetTitleCelebrated') : 'Likes'}
        </div>
        {/* The surface's own count — never likers.length. */}
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM, marginTop: 4 }}>
          {count === 1 ? '1 person' : `${count.toLocaleString()} people`}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{ overflowY: 'auto', maxHeight: '68dvh', overscrollBehavior: 'contain' }}
      >
        {isLoading && rows.length === 0 ? (
          <div style={{ padding: '20px 16px', fontSize: 12.5, color: A.MUTE }}>Loading…</div>
        ) : (
          <>
            {followed.length > 0 && (
              <div data-likes-group="following">
                {eyebrow('People you follow')}
                {followed.map(renderRow)}
              </div>
            )}
            {others.length > 0 && (
              <div data-likes-group="others">
                {eyebrow('Everyone else')}
                {others.map(renderRow)}
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}

export default LikesSheet;
