/**
 * LikedByRow — the single entry point to "who liked this".
 *
 * A tappable row directly under a card's like/comment actions row: up to three
 * 22px avatars overlapping by 7px, then a muted line of copy. The whole row is
 * one tap target and opens LikesSheet.
 *
 * COPY, by count:
 *   0    — nothing renders at all (no empty state, no gap)
 *   1    — "Liked by Thomas"
 *   2    — "Liked by Thomas and Amy"
 *   3+   — "Liked by Thomas, Amy and 10 others"
 *
 * FIRST NAMES ONLY so the line cannot wrap, and they are the FIRST entries of
 * the SAME ordered array the sheet renders (followed first, then everyone else,
 * each group most recent first) — a preview that disagrees with the list reads
 * as a bug.
 *
 * The COUNT comes from the surface, not from the list: excluded members must
 * not move the number.
 *
 * Read and presentation only. No like write path, and no long-press gesture.
 */
import { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { usePostLikers, likerFirstNames } from '@/hooks/usePostLikers';
import { LikesSheet } from './LikesSheet';

const AVATAR = 22;
const OVERLAP = 7;

export interface LikedByRowProps {
  postId: string | null;
  /** The surface's own like count. Zero renders nothing. */
  count: number;
  /** Card surface colour — the avatar borders take it so they read as separate. */
  surfaceColor?: string;
  source?: 'post' | 'editorial';
  style?: React.CSSProperties;
}

export function LikedByRow({
  postId,
  count,
  surfaceColor = A.CANVAS,
  source = 'post',
  style,
}: LikedByRowProps) {
  const [open, setOpen] = useState(false);
  // Preview needs the names, so the list is fetched for the row itself. It is
  // the same query key the sheet uses, so opening the sheet costs nothing.
  const { likers } = usePostLikers(postId, !!postId && count > 0, source);

  if (!postId || count <= 0) return null;

  const shown = likers.slice(0, 3);
  const names = likerFirstNames(likers, 2);

  let copy: string | null = null;
  if (names.length >= 2 && count > 2) {
    const others = Math.max(count - 2, 1);
    copy = `Liked by ${names[0]}, ${names[1]} and ${others.toLocaleString()} other${others === 1 ? '' : 's'}`;
  } else if (names.length >= 2) {
    copy = `Liked by ${names[0]} and ${names[1]}`;
  } else if (names.length === 1) {
    copy = count > 1
      ? `Liked by ${names[0]} and ${(count - 1).toLocaleString()} other${count - 1 === 1 ? '' : 's'}`
      : `Liked by ${names[0]}`;
  }

  // Names not resolved yet — hold the row rather than show a wrong preview.
  if (!copy) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: 0,
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          ...style,
        }}
      >
        {shown.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {shown.map((l, i) => (
              <div
                key={`${l.actorType ?? 'personal'}:${l.actorId ?? l.userId}`}
                style={{
                  marginLeft: i === 0 ? 0 : -OVERLAP,
                  borderRadius: '34%',
                  border: `1.5px solid ${surfaceColor}`,
                  lineHeight: 0,
                  zIndex: shown.length - i,
                }}
              >
                <SquircleAvatar
                  size={AVATAR}
                  src={l.avatarUrl}
                  alt={l.displayName}
                  userId={l.actorType === 'business' ? null : l.actorId ?? l.userId}
                  hideRing
                />
              </div>
            ))}
          </div>
        )}
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: A.MUTE,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {copy}
        </span>
      </button>

      <LikesSheet
        open={open}
        onClose={() => setOpen(false)}
        postId={postId}
        count={count}
        source={source}
      />
    </>
  );
}

export default LikedByRow;
