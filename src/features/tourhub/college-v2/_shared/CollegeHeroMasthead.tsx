/**
 * CollegeHeroMasthead — the shared single-row hero used by both the College
 * hub (leader spotlight) and the College profile page.
 *
 * Layout: crest (66 squircle, gold ring at rank 1) + name/meta stack +
 * optional right-hand actions slot, anchored to the bottom of a
 * clamp(380px, 44dvh, 460px) container with a 180deg brand-to-charcoal
 * gradient. Brand tint comes from `brandHex` (stored per college in
 * `college_media.brand_hex`); null renders the charcoal fallback cleanly.
 *
 * No runtime pixel extraction, no CORS dependency, no async color state.
 */

import type { ReactNode } from 'react';
import {
  AMBER,
  CHARCOAL,
  FONT,
  GOLD,
  STATUS_LIVE,
  WHITE_ALPHA_10,
  WHITE_ALPHA_18,
  WHITE_ALPHA_55,
  WHITE_ALPHA_65,
} from '@/features/tourhub/_shared/tokens';

const CHARCOAL_R = 0x14;
const CHARCOAL_G = 0x16;
const CHARCOAL_B = 0x1c;

function parseHex(hex: string): [number, number, number] | null {
  const s = hex.trim().replace(/^#/, '');
  if (s.length === 3) {
    const r = parseInt(s[0] + s[0], 16);
    const g = parseInt(s[1] + s[1], 16);
    const b = parseInt(s[2] + s[2], 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }
  if (s.length === 6) {
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }
  return null;
}

/**
 * Mix a hex color toward charcoal (#14161C) by `amount` (0..1). Guarantees
 * white text + gold accents keep AA contrast on the resulting gradient.
 */
function darkenTowardCharcoal(hex: string, amount = 0.4): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(parsed[0] * (1 - t) + CHARCOAL_R * t);
  const g = Math.round(parsed[1] * (1 - t) + CHARCOAL_G * t);
  const b = Math.round(parsed[2] * (1 - t) + CHARCOAL_B * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatPoints(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

interface Props {
  displayName: string;
  logoUrl: string | null;
  brandHex: string | null;
  rank: number | null;
  pointsTotal: number;
  alumniCount: number;
  playingNow: number;
  /** Positive = climbed; negative = fell; null/0 = hide chip. */
  rankChange?: number | null;
  /** Right-hand action slot (Follow / Compare buttons). */
  actions?: ReactNode;
}

export function CollegeHeroMasthead({
  displayName,
  logoUrl,
  brandHex,
  rank,
  pointsTotal,
  alumniCount,
  playingNow,
  rankChange = null,
  actions,
}: Props) {
  const isRankOne = rank === 1;

  const heroBackground = brandHex
    ? `linear-gradient(180deg, ${darkenTowardCharcoal(brandHex, 0.4)} 0%, ${CHARCOAL} 100%)`
    : `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`;

  const trend =
    rankChange == null || rankChange === 0
      ? null
      : rankChange > 0
      ? { label: `\u25B2${rankChange}`, color: '#4ADE80' }
      : { label: `\u25BC${Math.abs(rankChange)}`, color: '#F87171' };

  return (
    <div
      style={{
        background: heroBackground,
        minHeight:
          'calc(clamp(280px, 34dvh, 360px) + env(safe-area-inset-top, 0px))',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 24,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Crest 128 — unboxed, floats on the hero. Rank-1 gets an amber glow;
          others a neutral soft drop shadow for separation from busy gradients. */}
      <div
        style={{
          position: 'relative',
          width: 128,
          height: 128,
          flexShrink: 0,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: isRankOne
                ? 'drop-shadow(0 6px 24px rgba(255,184,0,0.35))'
                : 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: GOLD,
              letterSpacing: '0.04em',
              filter: isRankOne
                ? 'drop-shadow(0 6px 24px rgba(255,184,0,0.35))'
                : 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))',
            }}
          >
            {displayName.slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + meta (centred) */}
      <div style={{ width: '100%', minWidth: 0 }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: WHITE_ALPHA_55,
            marginBottom: 4,
          }}
        >
          THE FRANCHISE {rank ? `\u00B7 No.${rank}` : ''}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </h1>
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            fontWeight: 600,
            color: WHITE_ALPHA_65,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 6,
            rowGap: 4,
            flexWrap: 'wrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span style={{ color: isRankOne ? GOLD : AMBER, fontWeight: 800 }}>
            {formatPoints(pointsTotal)}
          </span>
          <span style={{ color: WHITE_ALPHA_55 }}>{'\u00B7'}</span>
          <span>{alumniCount} alumni on tour</span>
          {trend && (
            <>
              <span style={{ color: WHITE_ALPHA_55 }}>{'\u00B7'}</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 6px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  border: `0.5px solid ${WHITE_ALPHA_18}`,
                  color: trend.color,
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: '0.02em',
                }}
              >
                {trend.label}
              </span>
            </>
          )}
          {playingNow > 0 && (
            <>
              <span style={{ color: WHITE_ALPHA_55 }}>{'\u00B7'}</span>
              <span style={{ color: STATUS_LIVE, fontWeight: 700 }}>
                {playingNow} playing now
              </span>
            </>
          )}
        </div>
      </div>

      {actions && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}

      {/* subtle hairline base */}
      <div
        aria-hidden
        style={{
          marginTop: 16,
          alignSelf: 'stretch',
          height: 0.5,
          background: WHITE_ALPHA_10,
        }}
      />
    </div>
  );
}

export default CollegeHeroMasthead;
