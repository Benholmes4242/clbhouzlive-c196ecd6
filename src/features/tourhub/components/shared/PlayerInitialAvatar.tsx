/**
 * PlayerInitialAvatar — single shared avatar primitive for College Franchise
 * surfaces. Replaces three rolled-their-own implementations:
 *   - hero logo fallback (CollegeProfilePage)
 *   - rival row logo (rival strip)
 *   - alumni row headshot fallback (AlumniDepthChart)
 *
 * Renders the player headshot if available; on error or when no URL is
 * provided, falls back to a colored initial circle (no gray silhouette).
 *
 * The colored circle pulls from a deterministic palette based on the seed
 * string so the same player always gets the same color. This is the
 * "tour-honest UI" replacement for PLAYER_SILHOUETTE_URL.
 *
 * Phase 2 may extend to the multiple avatar sites in CollegeCompareHero.
 */

import { useState } from 'react';

const FALLBACK_PALETTE = [
  { bg: '#FEF3C7', fg: '#92400E' }, // amber
  { bg: '#DBEAFE', fg: '#1D4ED8' }, // blue
  { bg: '#DCFCE7', fg: '#166534' }, // green
  { bg: '#FCE7F3', fg: '#BE185D' }, // pink
  { bg: '#EDE9FE', fg: '#6D28D9' }, // purple
  { bg: '#FEE2E2', fg: '#B91C1C' }, // red
  { bg: '#CFFAFE', fg: '#155E75' }, // cyan
  { bg: '#F1F5F9', fg: '#334155' }, // slate
] as const;

function pickPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export interface PlayerInitialAvatarProps {
  /** Player display name — used for initial fallback + alt text + palette seed. */
  name: string;
  /** Optional photo/logo URL. Falls back to initial circle on error or absence. */
  src?: string | null;
  /** Square size in px. Default 34. */
  size?: number;
  /** Border radius. Default 'squircle' (~34%). */
  radius?: number | string;
  /** Override palette seed (e.g. team slug to share color across cards). */
  paletteSeed?: string;
  /** Optional explicit color override (skips palette). */
  color?: { bg: string; fg: string };
  /** Inner image render scale (0–1). Default 1 (fills). Used for logo padding. */
  imageScale?: number;
}

export function PlayerInitialAvatar({
  name,
  src,
  size = 34,
  radius = '34%',
  paletteSeed,
  color,
  imageScale = 1,
}: PlayerInitialAvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;
  const palette = color ?? pickPalette(paletteSeed ?? name);
  const innerSize = Math.round(size * imageScale);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
        background: showImage ? 'rgba(15,23,42,0.06)' : palette.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={src!}
          alt={name}
          loading="lazy"
          onError={() => setErrored(true)}
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
            fontSize: Math.round(size * 0.42),
            fontWeight: 800,
            color: palette.fg,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {getInitial(name)}
        </span>
      )}
    </div>
  );
}
