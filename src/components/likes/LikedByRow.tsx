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
 *   0    — nothing renders at all (no empty state, no gap). Without `reserve`,
 *          a count that drops to 0 while mounted collapses with the same
 *          180ms grid-rows/opacity animation a 0→>0 rise opens with; first
 *          render at count > 0 and prefers-reduced-motion never animate.
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
import { useEffect, useRef, useState } from 'react';
import { usePostLikers, likerFirstNames } from '@/hooks/usePostLikers';
import type { LikeSource } from '@/hooks/usePostLikes';
import { LikesSheet } from './LikesSheet';
import type { SubjectContext } from '@/components/sheets/SubjectContextLine';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName, getAvatarFallbackGradient } from '@/lib/avatarFallback';

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
   *  surfaceColor (a card or sheet ground). 'media' has no outer ring; hairline
   *  edge plus the on-media drop shadow, matching the fullscreen author avatar.
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
  /** H.5 — optional course context, passed straight to the sheet. */
  subject?: SubjectContext | null;
  /** Line type size; default 13 (Clubhouse FeedCard, ReviewBottomSheet, scorecard). */
  fontSize?: number;
  /** Line colour; default the dark-canvas 0.65 slate. Pass an on-photo value over photography. */
  color?: string;
  /** Line weight; default 500. */
  fontWeight?: number;
  /** 1 (default) = single line with ellipsis; 2 = wraps, clamped to two (stacked feed cards). */
  lines?: 1 | 2;
  /** CB56 — opt-in: with no likes, keep the line's space (same element style,
   *  same minHeight, an empty line) so the first like fills it in place and
   *  nothing above or below moves. aria-hidden, no tap target. Default off:
   *  without it zero still renders nothing. */
  reserve?: boolean;
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
  subject = null,
  color = 'rgba(248,250,252,0.65)',
  reserve = false,
}: LikedByRowProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  // The names are the same query key the sheet uses, so opening it costs
  // nothing. The line does not wait on it.
  const { likers, isLoading } = usePostLikers(postId, !!postId && count > 0, source);

  /* OPEN/COLLAPSE ANIMATION (no reserve): the row mounts only while `shown`
     is true. A 0→>0 rise while mounted opens with a 180ms grid-rows/opacity
     transition; a >0→0 drop collapses the same way and unmounts after the
     transition. First render at count > 0 has no transition (mountedRef is
     still false at first paint), and prefers-reduced-motion skips both the
     transition and the collapse delay. During the collapse the copy keeps the
     last positive count so the sentence does not blank mid-animation. */
  const [shown, setShown] = useState(count > 0);
  const mountedRef = useRef(false);
  const lastCountRef = useRef(count > 0 ? count : 0);
  const reducedRef = useRef<boolean | null>(null);
  const prefersReduced = () => {
    if (reducedRef.current === null) {
      reducedRef.current =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return reducedRef.current;
  };
  useEffect(() => {
    mountedRef.current = true;
  }, []);
  useEffect(() => {
    if (count > 0) {
      lastCountRef.current = count;
      setShown(true);
      return;
    }
    if (!shown || reserve) return;
    if (prefersReduced()) {
      setShown(false);
      return;
    }
    const id = window.setTimeout(() => setShown(false), 180);
    return () => window.clearTimeout(id);
  }, [count, shown, reserve]);
  const n = count > 0 ? count : lastCountRef.current;

  /* ONE style for the row and its reserved box, so the two match in height by
     construction: same element style, same minHeight, same text line. */
  const rowStyle: React.CSSProperties = {
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
  };
  const lineStyle: React.CSSProperties = {
    minWidth: 0,
    fontSize,
    fontWeight,
    color,
    ...(lines === 2
      ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }
      : { whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }),
    fontVariantNumeric: 'tabular-nums lining-nums',
    letterSpacing: 0,
  };

  if (!postId || (count <= 0 && !shown)) {
    if (!reserve) return null;
    return (
      <div aria-hidden="true" data-liked-by-reserve="true" style={{ ...rowStyle, pointerEvents: 'none' }}>
        <span style={lineStyle}>{'\u00a0'}</span>
      </div>
    );
  }

  const names = likerFirstNames(likers, 2);
  // VIEWER-FIRST: usePostLikers sorts the viewer to the front. Their own name
  // read back in the third person reads as a bug — they are "you", via their
  // own keys (several languages inflect the verb with "you").
  const viewerFirst = likers[0]?.isViewer === true;
  const otherName = viewerFirst ? likerFirstNames(likers.slice(1), 1)[0] ?? null : null;

  let copy: string;
  if (viewerFirst && kind === 'celebrate') {
    const restAfter = n - 1 - (otherName ? 1 : 0);
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
    const restAfter = n - 1 - (otherName ? 1 : 0);
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
    const rest = n - names.length;
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
    const who = namesText ?? n.toLocaleString();
    const owner = ownerName?.trim();
    copy = isOwnRound
      ? t('reactions.celebratedYourRound', { names: who })
      : owner
        ? t('reactions.celebratedOwnersRound', { names: who, owner })
        : t('reactions.celebratedThisRound', { names: who });
  } else if (names.length >= 2 && n > 2) {
    const others = Math.max(n - 2, 1);
    copy = `Liked by ${names[0]}, ${names[1]} and ${others.toLocaleString()} other${others === 1 ? '' : 's'}`;
  } else if (names.length >= 2) {
    copy = `Liked by ${names[0]} and ${names[1]}`;
  } else if (names.length === 1) {
    copy = n > 1
      ? `Liked by ${names[0]} and ${(n - 1).toLocaleString()} other${n - 1 === 1 ? '' : 's'}`
      : `Liked by ${names[0]}`;
  } else {
    // Names not resolved yet — the SAME SENTENCE with a figure in place of the
    // names, never a second rendering of the like n. "12 likes" would
    // repeat the number already beside the heart glyph nine pixels above, and
    // would read as one statement being swapped for a different one rather
    // than names arriving inside a sentence that was already there.
    copy = `Liked by ${n.toLocaleString()} golfer${n === 1 ? '' : 's'}`;
  }


  /* The grid-rows wrapper is the open/collapse animation: 0fr→1fr (and back)
     over 180ms with the inner element clipped. No transition on first render
     (mountedRef) or under prefers-reduced-motion — the row is simply there. */
  const isOpen = count > 0;
  const animate = mountedRef.current && !prefersReduced();
  return (
    <>
    <div
      style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        opacity: isOpen ? 1 : 0,
        ...(animate ? { transition: 'grid-template-rows 180ms ease-out, opacity 180ms ease-out' } : null),
      }}
    >
    <div style={{ overflow: 'hidden', minHeight: 0 }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
        style={rowStyle}
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
              height: 20,
              width: 19 + (Math.min(n, 3) - 1) * 12,
              ...(avatarRing === 'media' ? { filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' } : null),
            }}
          >
            {Array.from({ length: isLoading ? Math.min(n, 3) : Math.min(likers.length, Math.min(n, 3)) }, (_, i) => {
              const liker = likers[i];
              /* OUTER ring (surfaceColor) separates disc from disc on a 'surface'
                 ground only; the INNER hairline (SquircleAvatar hairlineRing)
                 gives each disc an edge on any ground. Not interchangeable — keep
                 both. No overflow clip: it would cut the hairline overlay. */
              const slot: React.CSSProperties = {
                position: 'absolute',
                top: 0,
                left: i * 12,
                width: 19,
                height: 20,
                flex: 'none',
                borderRadius: '34%',
                ...(avatarRing === 'surface' ? { boxShadow: `0 0 0 1.5px ${surfaceColor}` } : null),
                zIndex: 3 - i,
              };
              if (!liker) {
                return (
                  <span
                    key={i}
                    style={{
                      ...slot,
                      background: getAvatarFallbackGradient(null),
                      boxShadow: slot.boxShadow
                        ? `${slot.boxShadow}, inset 0 0 0 1px rgba(255,255,255,0.22)`
                        : 'inset 0 0 0 1px rgba(255,255,255,0.22)',
                    }}
                  />
                );
              }
              /* ONE branch: SquircleAvatar paints its fill first and fades the
                 bitmap in, so a missing or dead URL degrades to the initials disc. */
              return (
                <span key={i} style={slot}>
                  <SquircleAvatar
                    size={19}
                    src={liker.avatarUrl}
                    alt={liker.displayName ?? ''}
                    userId={liker.actorId ?? liker.userId}
                    fallback={getInitialsFromName(liker.displayName ?? '').charAt(0)}
                    hairlineRing
                  />
                </span>
              );
            })}
          </span>
        )}
        <span style={lineStyle}>
          {copy}
        </span>
      </button>
    </div>

      {/* Taps inside the sheet bubble through the React tree even though it
          portals; this span keeps them from reaching a parent card. */}
      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} style={{ display: 'contents' }}>
      <LikesSheet
        open={open}
        onClose={() => setOpen(false)}
        postId={postId}
        count={count}
        source={source}
        kind={kind}
        subject={subject}
      />
      </span>
    </div>
    </>
  );
}


export default LikedByRow;
