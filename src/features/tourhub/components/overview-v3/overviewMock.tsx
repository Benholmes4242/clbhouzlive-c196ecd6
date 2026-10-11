/**
 * BRIEF_TOUR_OVERVIEW_MOCK_EXACT — the signed-off mock's own values.
 *
 * THE MOCK IS THE SPEC. These figures are carried exactly as the brief states
 * them and are not rounded to the nearest existing tour token. Where a value
 * coincides with an existing token (AMBER, INK) the token is read instead, so
 * no colour is declared twice. Everything here is used only by the Overview
 * hero, its bands and the heroBoard theme of MiniBoard.
 */
import { useState } from 'react';
import { AMBER, INK } from '../../_shared/tokens';

export const MOCK = {
  /** Muted caps / secondary figures on the dark band ground. */
  mute: 'rgba(248,250,252,0.42)',
  /** Body copy one step down from INK. */
  soft: 'rgba(248,250,252,0.62)',
  hairline: 'rgba(255,255,255,0.08)',
  cardGround: 'rgba(255,255,255,0.05)',
  bracket: 'rgba(255,255,255,0.18)',
  spine: {
    done: 'rgba(255,255,255,0.72)',
    todo: 'rgba(255,255,255,0.30)',
    label: 'rgba(255,255,255,0.50)',
    connector: 'rgba(255,255,255,0.18)',
    liveHalo: '0 0 0 3px rgba(247,147,30,0.25)',
  },
  trio: {
    faceBorder: '1.5px solid rgba(8,12,16,0.9)',
    caps: 'rgba(255,255,255,0.72)',
  },
  shape: {
    /** Under par. Deliberately the mock's value, not TOPAR_UNDER_DARK (#E24B3F). */
    under: '#E5664F',
    level: 'rgba(248,250,252,0.62)',
    stub: 'rgba(255,255,255,0.14)',
    live: AMBER,
  },
  ink: INK,
  amber: AMBER,
} as const;

/** "Three", "Two"… from the locale; numerals past ten. Caps come from CSS. */
export function countInWords(count: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (count >= 2 && count <= 10) return t(`overview.countWords.${count}`);
  return String(count);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * A face at the mock's exact radius. Walks the shared resolver's candidates
 * (resolvePlayerAvatarCandidates) and falls back to an initials tile when
 * every candidate misses. Not SquircleAvatar: that component fixes its radius
 * at 34% and adds a ring, and the mock gives 28/9 and 22/7 with no ring.
 */
export function MockFace({
  name,
  candidates,
  size,
  radius,
  border,
  style,
}: {
  name: string;
  candidates: string[];
  size: number;
  radius: number;
  border?: string;
  style?: React.CSSProperties;
}) {
  const [index, setIndex] = useState(0);
  const src = candidates[index];
  return (
    <span
      aria-hidden
      data-mock-face
      style={{
        position: 'relative',
        flex: 'none',
        width: size,
        height: size,
        borderRadius: radius,
        border,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: MOCK.cardGround,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: MOCK.mute,
        fontSize: Math.round(size * 0.36),
        fontWeight: 700,
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setIndex((i) => i + 1)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
