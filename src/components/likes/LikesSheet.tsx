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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { LIKES_SHEET_Z } from '@/lib/zLayers';
import { formatHcp } from '@/lib/formatHcp';
import { usePostLikers } from '@/hooks/usePostLikers';

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
  source?: 'post' | 'editorial';
}

export function LikesSheet({ open, onClose, postId, count, source = 'post' }: LikesSheetProps) {
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

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      zIndexBase={LIKES_SHEET_Z}
      surfaceColor={A.CANVAS}
      maxHeight="85dvh"
    >
      <div style={{ padding: '4px 16px 12px', borderBottom: `1px solid ${A.BORDER}` }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}>
          Likes
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: A.MUTE, marginTop: 2 }}>
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
          rows.map((l) => {
            const isBusiness = l.actorType === 'business';
            const sub = isBusiness
              ? businessTypeLabel(l.businessType)
              : l.handicapIndex !== null
                ? `${formatHcp(l.handicapIndex)} index`
                : null;
            return (
              <button
                key={`${l.actorType ?? 'personal'}:${l.actorId ?? l.userId}`}
                type="button"
                onClick={() => {
                  onClose();
                  if (isBusiness) {
                    if (l.username) navigate(`/business/${l.username}`);
                  } else if (l.username) {
                    navigate(`/u/${l.username}`);
                  }
                }}
                style={{
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
                <SquircleAvatar
                  size={38}
                  src={l.avatarUrl}
                  alt={l.displayName}
                  userId={isBusiness ? null : l.actorId ?? l.userId}
                  hairlineRing
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: A.INK,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {l.displayName || l.username}
                  </div>
                  {sub ? (
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: A.MUTE,
                        marginTop: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {sub}
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
}

export default LikesSheet;
