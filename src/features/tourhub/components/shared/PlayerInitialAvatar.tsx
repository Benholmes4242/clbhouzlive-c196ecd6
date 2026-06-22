/**
 * PlayerInitialAvatar — shared avatar primitive for College Franchise
 * surfaces (player headshots AND college logos).
 *
 * Renders an image when available, then walks any `srcCandidates` fallback
 * chain on error, and finally shows initials on a deterministic colour
 * background — using the CANONICAL helpers from `@/lib/avatarFallback`
 * so the fallback matches Clubhouse, Handicap and the tour hero.
 *
 * For LOGO usage (college badges), callers pass an explicit `color` prop
 * + `imageScale<1` to keep the existing tinted-logo look.
 */

import { useState, useEffect } from 'react';
import { INK_TINT_06 } from '../../_shared/tokens';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';

export interface PlayerInitialAvatarProps {
  /** Player display name — used for initials, alt text and palette seed. */
  name: string;
  /** Optional photo/logo URL. Falls back to initials on error or absence. */
  src?: string | null;
  /** Ordered candidate URLs (event tour first, cross-tour folders after).
   *  Takes precedence over `src` when provided. Walked on error. */
  srcCandidates?: (string | null | undefined)[];
  /** Square size in px. Default 34. */
  size?: number;
  /** Border radius. Default 'squircle' (~34%). */
  radius?: number | string;
  /** Override palette seed (e.g. team slug to share colour across cards). */
  paletteSeed?: string;
  /** Optional explicit colour override (skips canonical palette). Used by
   *  college LOGO callers that want their tinted look preserved. */
  color?: { bg: string; fg: string };
  /** Inner image render scale (0–1). Default 1 (fills). For logo padding. */
  imageScale?: number;
}

export function PlayerInitialAvatar({
  name,
  src,
  srcCandidates,
  size = 34,
  radius = '34%',
  paletteSeed,
  color,
  imageScale = 1,
}: PlayerInitialAvatarProps) {
  const candidates: string[] = (() => {
    if (srcCandidates && srcCandidates.length > 0) {
      return srcCandidates.filter((u): u is string => Boolean(u));
    }
    return src ? [src] : [];
  })();

  const [idx, setIdx] = useState(0);
  // Reset to first candidate whenever the list identity changes.
  useEffect(() => {
    setIdx(0);
  }, [candidates.join('|')]);

  const exhausted = candidates.length === 0 || idx >= candidates.length;
  const currentSrc = exhausted ? null : candidates[idx];
  const showImage = !!currentSrc;

  // Use the canonical fallback when no explicit `color` override is passed.
  // Logo callers still pass `color` to keep their tinted-badge look.
  const fallbackBg = color?.bg ?? getAvatarFallbackColor(paletteSeed ?? name);
  const fallbackFg = color?.fg ?? '#FFFFFF';
  const initials = getInitialsFromName(name) || '?';

  const innerSize = Math.round(size * imageScale);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
        background: showImage ? INK_TINT_06 : fallbackBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={currentSrc!}
          alt={name}
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          style={{
            width: innerSize,
            height: innerSize,
            objectFit: imageScale < 1 ? 'contain' : 'cover',
            objectPosition: 'center 5%',
          }}
        />
      ) : (
        <span
          style={{
            fontSize: Math.round(size * 0.38),
            fontWeight: 700,
            color: fallbackFg,
            letterSpacing: '0.01em',
            lineHeight: 1,
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
