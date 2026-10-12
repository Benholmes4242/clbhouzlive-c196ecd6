/**
 * LikesSheet — the full list of who liked something.
 *
 * TITLE IS "Likes", NOT "Liked this post": a round can be hearted from a
 * Discover tile when no post exists at all, and the same round in the feed
 * shares that ONE list. The title has to describe the likes, not the post.
 *
 * Every row is the ACTOR: a business like shows the business's name and logo
 * (resolved in usePostLikes from business_accounts), never the human behind it.
 * Businesses have no handicap, so their row shows the business type instead. No empty handicap line.
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
import { SubjectContextLine, type SubjectContext } from '@/components/sheets/SubjectContextLine';
import { useLikerStandings } from '@/features/comments-v2/hooks/useCommentsContext';
import type { LikerStanding } from '@/features/comments-v2/lib/standing';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';

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
  /**
   * H.5 — OPTIONAL course context: what the sheet is about. Absent -> no
   * context line and no course segment; the sheet behaves exactly as before.
   */
  subject?: SubjectContext | null;
}

/** H.4 — one segment after the handicap; null renders nothing at all. */
function standingSegment(s: LikerStanding | undefined): { text: string; record: boolean } | null {
  if (!s) return null;
  if (s.kind === 'record') return { text: `Course record \u00B7 ${s.value}`, record: true };
  if (s.kind === 'best') return { text: `Best here ${s.value}`, record: false };
  return { text: s.n === 1 ? 'Played here once' : `Played here ${s.n} times`, record: false };
}

export function LikesSheet({ open, onClose, postId, count, source = 'post', kind = 'like', subject = null }: LikesSheetProps) {
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

  /* THREE TIERS, in usePostLikers' own order: the hook returns the viewer
     first (isViewer), then people the viewer follows (!isViewer &&
     isFollowing), then everyone else. The sheet renders all three: the
     viewer's row with NO eyebrow (the amber "· You" names it), then
     "People you follow", then "Everyone else". Nothing is re-sorted within a
     group, and an empty group renders nothing, eyebrow included. */
  const viewerRows = rows.filter((l) => l.isViewer);
  const followed = rows.filter((l) => !l.isViewer && l.isFollowing);
  const others = rows.filter((l) => !l.isViewer && !l.isFollowing);

  /* H.4 — ONE batched pair of reads for the whole sheet, personal likers only. */
  const standingIds = useMemo(
    () => likers.filter((l) => l.actorType !== 'business').map((l) => l.actorId ?? l.userId).filter(Boolean) as string[],
    [likers],
  );
  const { data: standingByUser } = useLikerStandings(subject?.courseId ?? null, standingIds, open);

  const renderRow = (l: (typeof rows)[number], i: number, firstPad = false) => {
    const isBusiness = l.actorType === 'business';
    const actorId = l.actorId ?? l.userId;
    // Actor-matched in usePostLikers — a member acting as a business is not
    // "you" on their personal row, and is "you" on the business's.
    const isViewer = l.isViewer;
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
          padding: firstPad ? '14px 16px 10px' : '10px 16px',
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
              {(() => {
                const seg = standingSegment(standingByUser?.get(actorId));
                if (!seg) return null;
                return (
                  <span data-liker-standing={seg.record ? 'record' : 'other'} style={{ display: 'contents' }}>
                    <span aria-hidden style={{ fontSize: 12.5, color: A.DIM }}>{'\u00B7'}</span>
                    <span style={{ fontSize: 12, fontWeight: seg.record ? 700 : 600, color: seg.record ? SC_FILL_GOLD : A.DIM, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                      {seg.text}
                    </span>
                  </span>
                );
              })()}
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
        <SubjectContextLine subject={subject} dataAttr="likes-context" />
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
            {viewerRows.length > 0 && (
              <div data-likes-group="viewer">
                {viewerRows.map((l, i) => renderRow(l, i, i === 0))}
              </div>
            )}
            {followed.length > 0 && (
              <div data-likes-group="following">
                {eyebrow('People you follow')}
                {followed.map((l, i) => renderRow(l, i))}
              </div>
            )}
            {others.length > 0 && (
              <div data-likes-group="others">
                {eyebrow('Everyone else')}
                {others.map((l, i) => renderRow(l, i))}
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}

export default LikesSheet;
