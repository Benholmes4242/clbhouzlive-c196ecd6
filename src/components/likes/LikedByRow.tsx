/**
 * LikedByRow — the single entry point to "who liked this".
 *
 * ONE LINE OF TEXT, PRESENT IMMEDIATELY (BRIEF_FEED_CARD_REBUILD section B).
 * The avatar cluster is gone: three 22px squircles arrived a beat after the
 * card, so the footer moved under the thumb. The row is now a single tappable
 * text line that renders the moment the card does, and swaps to names when
 * they resolve. No layout change either way.
 *
 * COPY, by count:
 *   0    — nothing renders at all (no empty state, no gap)
 *   1    — "Liked by Thomas"
 *   2    — "Liked by Thomas and Amy"
 *   3+   — "Liked by Thomas, Amy and 10 others"
 *
 * NEUTRAL FALLBACK while names are in flight: "1 like" / "12 likes". It states
 * the count the surface already knows, so nothing can disagree and nothing
 * reflows when the names land.
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
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { usePostLikers, likerFirstNames } from '@/hooks/usePostLikers';
import { LikesSheet } from './LikesSheet';

export interface LikedByRowProps {
  postId: string | null;
  /** The surface's own like count. Zero renders nothing. */
  count: number;
  /**
   * DEAD PROP (section B). The avatar borders took the card surface colour so
   * they read as separate; there are no avatars now. Retained so every caller
   * renders unchanged and recorded on the dead-code list.
   */
  surfaceColor?: string;
  source?: 'post' | 'editorial';
  style?: React.CSSProperties;
}

export function LikedByRow({
  postId,
  count,
  surfaceColor,
  source = 'post',
  style,
}: LikedByRowProps) {
  const [open, setOpen] = useState(false);
  // The names are the same query key the sheet uses, so opening it costs
  // nothing. The line does not wait on it.
  const { likers } = usePostLikers(postId, !!postId && count > 0, source);

  if (!postId || count <= 0) return null;

  const names = likerFirstNames(likers, 2);

  let copy: string;
  if (names.length >= 2 && count > 2) {
    const others = Math.max(count - 2, 1);
    copy = `Liked by ${names[0]}, ${names[1]} and ${others.toLocaleString()} other${others === 1 ? '' : 's'}`;
  } else if (names.length >= 2) {
    copy = `Liked by ${names[0]} and ${names[1]}`;
  } else if (names.length === 1) {
    copy = count > 1
      ? `Liked by ${names[0]} and ${(count - 1).toLocaleString()} other${count - 1 === 1 ? '' : 's'}`
      : `Liked by ${names[0]}`;
  } else {
    // Names not resolved yet — state the count rather than hold the row.
    copy = `${count.toLocaleString()} like${count === 1 ? '' : 's'}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'block',
          width: '100%',
          padding: 0,
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          ...style,
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: A.MUTE,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            fontVariantNumeric: 'tabular-nums lining-nums',
            letterSpacing: '-0.04em',
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

