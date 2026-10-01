/**
 * LikedByRow — the single entry point to "who liked this".
 *
 * ONE LINE, PRESENT IMMEDIATELY, WITH ITS SPACE ALREADY RESERVED.
 * The avatar cluster was removed once because three squircles arrived a beat
 * after the card and the footer moved under the thumb. It is back on one
 * condition: the row reserves its full height and the stack its full width at
 * FIRST PAINT. Slot count comes from `count` — known immediately — never from
 * `likers.length`, which is not. Unresolved slots are neutral placeholders at
 * final size, and avatars replace them in place. If a change here can move the
 * row between first paint and resolution, it reintroduces the bug that removed
 * the cluster the first time.
 *
 * COPY, by count:
 *   0    — nothing renders at all (no empty state, no gap)
 *   1    — "Liked by Thomas"
 *   2    — "Liked by Thomas and Amy"
 *   3+   — "Liked by Thomas, Amy and 10 others"
 *
 * NEUTRAL FALLBACK while names are in flight: "Liked by 12 golfers" / "Liked by
 * 1 golfer". It is the same sentence the resolved line is, with a figure where
 * the names will sit, so the swap reads as names arriving rather than a
 * different statement — and it does not render the like count a second time.

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
import { useTranslation } from 'react-i18next';
import type { ReactionKind } from '@/lib/reactionKind';
import { useState } from 'react';
import { usePostLikers, likerFirstNames } from '@/hooks/usePostLikers';
import type { LikeSource } from '@/hooks/usePostLikes';
import { LikesSheet } from './LikesSheet';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';

export interface LikedByRowProps {
  postId: string | null;
  /** The surface's own like count. Zero renders nothing. */
  count: number;
  /**
   * The ground this row sits on. Rings the overlapping avatars so they read as
   * separate — pass the card's own background, never a guess.
   */
  surfaceColor?: string;
  /** How the overlapping avatars are ringed. 'surface' rings them in
   *  surfaceColor (a card or sheet ground). 'media' rings them in scrim and
   *  adds the on-media drop shadow, for chrome over a photo or video.
   *  'none' draws no avatars at all. */
  avatarRing?: 'surface' | 'media' | 'none';
  source?: LikeSource;
  /** 'celebrate' on ROUNDS — see lib/reactionKind. Never a plural noun. */
  kind?: ReactionKind;
  /** The round owner's FIRST name (celebrate only). */
  ownerName?: string | null;
  /** The viewer owns the round (celebrate only). */
  isOwnRound?: boolean;
  style?: React.CSSProperties;
  /** Line type size; default 13 (Clubhouse FeedCard, ReviewBottomSheet, scorecard). */
  fontSize?: number;
  /** Line colour; default the dark-canvas 0.65 slate. Pass an on-photo value over photography. */
  color?: string;
  /** Line weight; default 500. */
  fontWeight?: number;
  /** 1 (default) = single line with ellipsis; 2 = wraps, clamped to two (stacked feed cards). */
  lines?: 1 | 2;
}

export function LikedByRow({
  postId,
  count,
  surfaceColor = MEMBER_PANEL,
  avatarRing = 'surface',
  source = 'post',
  style,
  kind = 'like',
  ownerName = null,
  isOwnRound = false,
  fontSize = 13,
  fontWeight = 500,
  lines = 1,
  color = 'rgba(248,250,252,0.65)',
}: LikedByRowProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  // The names are the same query key the sheet uses, so opening it costs
  // nothing. The line does not wait on it.
  const { likers, isLoading } = usePostLikers(postId, !!postId && count > 0, source);

  if (!postId || count <= 0) return null;

  const names = likerFirstNames(likers, 2);
  // VIEWER-FIRST: usePostLikers sorts the viewer to the front. Their own name
  // read back in the third person reads as a bug — they are "you", via their
  // own keys (several languages inflect the verb with "you").
  const viewerFirst = likers[0]?.isViewer === true;
  const otherName = viewerFirst ? likerFirstNames(likers.slice(1), 1)[0] ?? null : null;

  let copy: string;
  if (viewerFirst && kind === 'celebrate') {
    const restAfter = count - 1 - (otherName ? 1 : 0);
    const youText =
      restAfter <= 0
        ? otherName ? t('reactions.youAndName', { b: otherName }) : t('reactions.youOnly')
        : restAfter === 1
          ? otherName ? t('reactions.youNameAndOne', { b: otherName }) : t('reactions.youAndOne')
          : otherName
            ? t('reactions.youNameAndMore', { b: otherName, n: restAfter.toLocaleString() })
            : t('reactions.youAndMore', { n: restAfter.toLocaleString() });
    const owner = ownerName?.trim();
    copy = isOwnRound
      ? t('reactions.youCelebratedYourRound', { names: youText })
      : owner
        ? t('reactions.youCelebratedOwnersRound', { names: youText, owner })
        : t('reactions.youCelebratedThisRound', { names: youText });
  } else if (viewerFirst) {
    const restAfter = count - 1 - (otherName ? 1 : 0);
    copy =
      restAfter <= 0
        ? otherName ? t('reactions.likedByYouAndName', { b: otherName }) : t('reactions.likedByYou')
        : restAfter === 1
          ? otherName ? t('reactions.likedByYouNameAndOne', { b: otherName }) : t('reactions.likedByYouAndOne')
          : otherName
            ? t('reactions.likedByYouNameAndMore', { b: otherName, n: restAfter.toLocaleString() })
            : t('reactions.likedByYouAndMore', { n: restAfter.toLocaleString() });
  } else if (kind === 'celebrate') {
    // "{names} celebrated this round" — the verb, never a plural noun.
    const rest = count - names.length;
    const namesText =
      names.length === 0
        ? null
        : rest <= 0
          ? names.length === 2
            ? t('reactions.namesTwo', { a: names[0], b: names[1] })
            : names[0]
          : rest === 1
            ? t(names.length === 2 ? 'reactions.namesTwoAndOne' : 'reactions.namesOneAndOne', { a: names[0], b: names[1] })
            : t(names.length === 2 ? 'reactions.namesTwoAndMore' : 'reactions.namesOneAndMore', { a: names[0], b: names[1], n: rest.toLocaleString() });
    // WHOSE ROUND: own -> "your round"; known owner -> "<Name>'s round"
    // (always 's, even after an s); otherwise the still-true "this round".
    // Never a bare "'s round".
    const who = namesText ?? count.toLocaleString();
    const owner = ownerName?.trim();
    copy = isOwnRound
      ? t('reactions.celebratedYourRound', { names: who })
      : owner
        ? t('reactions.celebratedOwnersRound', { names: who, owner })
        : t('reactions.celebratedThisRound', { names: who });
  } else if (names.length >= 2 && count > 2) {
    const others = Math.max(count - 2, 1);
    copy = `Liked by ${names[0]}, ${names[1]} and ${others.toLocaleString()} other${others === 1 ? '' : 's'}`;
  } else if (names.length >= 2) {
    copy = `Liked by ${names[0]} and ${names[1]}`;
  } else if (names.length === 1) {
    copy = count > 1
      ? `Liked by ${names[0]} and ${(count - 1).toLocaleString()} other${count - 1 === 1 ? '' : 's'}`
      : `Liked by ${names[0]}`;
  } else {
    // Names not resolved yet — the SAME SENTENCE with a figure in place of the
    // names, never a second rendering of the like count. "12 likes" would
    // repeat the number already beside the heart glyph nine pixels above, and
    // would read as one statement being swapped for a different one rather
    // than names arriving inside a sentence that was already there.
    copy = `Liked by ${count.toLocaleString()} golfer${count === 1 ? '' : 's'}`;
  }


  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 22,
          width: '100%',
          boxSizing: 'border-box',
          padding: 0,
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          ...style,
        }}
      >
        {/* THE WIDTH LIVES ON THIS CONTAINER, NOT ON THE SLOTS. Slot COUNT is reserved
           from `count` (known at first paint); the faces come from `likers`, which has
           blocked members removed and can therefore be shorter. Sizing the container
           means a missing face leaves empty space inside a box that never changes
           width — rather than a placeholder square that never resolves and reads as a
           stuck spinner. Do not move the width back onto the slots. */}
        {avatarRing !== 'none' && (
          <span
            aria-hidden="true"
            style={{
              position: 'relative',
              flex: 'none',
              height: 18,
              width: 18 + (Math.min(count, 3) - 1) * 12,
              ...(avatarRing === 'media' ? { filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' } : null),
            }}
          >
            {Array.from({ length: isLoading ? Math.min(count, 3) : Math.min(likers.length, Math.min(count, 3)) }, (_, i) => {
              const liker = likers[i];
              const slot: React.CSSProperties = {
                width: 18,
                height: 18,
                borderRadius: 6,
                flex: 'none',
                position: 'absolute',
                top: 0,
                left: i * 12,
                boxShadow: `0 0 0 1.5px ${avatarRing === 'media' ? 'rgba(0,0,0,0.55)' : surfaceColor}`,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3 - i,
              };
              if (!liker) {
                return <span key={i} style={{ ...slot, background: 'rgba(255,255,255,0.07)' }} />;
              }
              if (liker.avatarUrl) {
                return (
                  <span key={i} style={slot}>
                    <img src={liker.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </span>
                );
              }
              return (
                <span key={i} style={{ ...slot, background: 'rgba(255,255,255,0.10)', color: 'rgba(248,250,252,0.62)', fontSize: 8, fontWeight: 700, lineHeight: 1 }}>
                  {(liker.displayName ?? '').trim().charAt(0).toUpperCase()}
                </span>
              );
            })}
          </span>
        )}
        <span
          style={{
            minWidth: 0,
            fontSize,
            fontWeight,
            color,
            ...(lines === 2
              ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }
              : { whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }),
            fontVariantNumeric: 'tabular-nums lining-nums',
            letterSpacing: 0,
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
        kind={kind}
      />
    </>
  );
}


export default LikedByRow;
