/**
 * CollegeHeroMasthead - the shared single-row hero used by both the College
 * hub (leader spotlight) and the College profile page.
 *
 * Layout: crest (66 squircle, gold ring at rank 1) + name/meta stack +
 * optional right-hand actions slot, anchored inside a HERO_MIN_H container
 * (the canonical tour hero height, see _shared/tokens) with a 180deg
 * brand-to-charcoal gradient. Brand tint comes from `brandHex` (stored per college in
 * `college_media.brand_hex`); null renders the charcoal fallback cleanly.
 *
 * No runtime pixel extraction, no CORS dependency, no async color state.
 */

import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CHARCOAL,
  FONT,
  HERO_MIN_H,
  GOLD,
  STATUS_LIVE_ON_DARK,
  WHITE_ALPHA_10,
  WHITE_ALPHA_55,
} from '@/features/tourhub/_shared/tokens';
import { formatEarnings } from '@/features/tourhub/_shared/formatEarnings';

/* Figure-row typography. Labels use WHITE_ALPHA_55 - the light-surface A.DIM
   token does not read on this dark gradient. */
const LABEL_STYLE: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: WHITE_ALPHA_55,
};

const FIGURE_STYLE: CSSProperties = {
  fontSize: 19,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: '#FFFFFF',
  marginTop: 4,
  lineHeight: 1.05,
};

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

/* Money formatting lives in _shared/formatEarnings.ts - one implementation. */


interface Props {
  displayName: string;
  logoUrl: string | null;
  brandHex: string | null;
  rank: number | null;
  pointsTotal: number;
  alumniCount: number;
  playingNow: number;
  /**
   * Kept for API compatibility with the profile page. No longer rendered:
   * the hub hero describes the No.1 college (whose rank cannot move without
   * the whole board changing) and the movement is stated on its row below.
   */
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
  actions,
}: Props) {
  const { t } = useTranslation('tourhub');
  const isRankOne = rank === 1;

  const showEarnings = !!pointsTotal && pointsTotal > 0;
  const showAlumni = alumniCount > 0;
  const showPlaying = playingNow > 0;

  const heroBackground = brandHex
    ? `linear-gradient(180deg, ${darkenTowardCharcoal(brandHex, 0.4)} 0%, ${CHARCOAL} 100%)`
    : `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`;


  return (
    <div
      style={{
        background: heroBackground,
        minHeight: HERO_MIN_H,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 12,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Crest 128 - unboxed, floats on the hero. Rank-1 gets an amber glow;
          others a neutral soft drop shadow for separation from busy gradients. */}
      <div
        style={{
          position: 'relative',
          width: 64,
          height: 64,
          flexShrink: 0,
          marginBottom: 8,
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
              fontSize: 22,
              fontWeight: 700,
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

      {/* Name + figures (centred) */}
      <div style={{ width: '100%', minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: WHITE_ALPHA_55,
            marginBottom: 2,
          }}
        >
          THE FRANCHISE {rank ? `\u00B7 No.${rank}` : ''}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
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

        {/* Three-figure row. Each cell self-hides; the row hides when empty. */}
        {(showEarnings || showAlumni || showPlaying) && (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: 28,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {showEarnings && (
              <div style={{ textAlign: 'center' }}>
                <div style={LABEL_STYLE}>{t('college.hero.earnings')}</div>
                <div style={FIGURE_STYLE}>{formatEarnings(pointsTotal)}</div>
              </div>
            )}
            {showAlumni && (
              <div style={{ textAlign: 'center' }}>
                <div style={LABEL_STYLE}>{t('college.hero.alumni')}</div>
                <div style={FIGURE_STYLE}>{alumniCount}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: WHITE_ALPHA_55,
                    marginTop: 2,
                  }}
                >
                  {t('college.hero.alumniSub')}
                </div>
              </div>
            )}
            {showPlaying && (
              <div style={{ textAlign: 'center' }}>
                <div style={LABEL_STYLE}>{t('college.hero.playingNow')}</div>
                <div style={{ ...FIGURE_STYLE, color: STATUS_LIVE_ON_DARK }}>
                  {playingNow}
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {actions && (
        <div
          style={{
            marginTop: 8,
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
          marginTop: 8,
          alignSelf: 'stretch',
          height: 0.5,
          background: WHITE_ALPHA_10,
        }}
      />
    </div>
  );
}

export default CollegeHeroMasthead;
