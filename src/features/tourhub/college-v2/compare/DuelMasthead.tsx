/**
 * DuelMasthead - charcoal head for the compare page.
 *
 * Convergence with the College profile hero (CollegeHeroMasthead):
 *   - Same vertical rhythm: min-height clamp(280px, 34dvh, 360px) + sat,
 *     paddingTop 62 + sat, paddingBottom 24. Renders full-bleed.
 *   - Crests are UNBOXED - no rings, no tile fill, drawn directly on the
 *     hero at 104px (largest that keeps proportional parity with the
 *     detail page's 128 while still fitting the two-up layout + centre
 *     rule at 375pt).
 *   - Rank-1 school gets the amber drop-shadow glow from the detail page;
 *     the other gets a neutral soft shadow for separation.
 *   - School names scale up to 20/800, "No.{n} . {n} live" lockup to 12s.
 *
 * HEAD TO HEAD overline stays. CHANGE buttons unchanged (small ghost).
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { YearbookStanding } from '@/features/tourhub/college-v2/hub/data/useFranchiseStandings';
import {
  AMBER,
  CHARCOAL,
  FONT,
  HERO_MIN_H,
  GOLD,
  STATUS_LIVE_ON_DARK,
  WHITE_ALPHA_30,
  WHITE_ALPHA_65,
} from '@/features/tourhub/_shared/tokens';

interface Props {
  left: YearbookStanding | null;
  right: YearbookStanding | null;
  liveLeft: number;
  liveRight: number;
  onChangeLeft: () => void;
  onChangeRight: () => void;
}

const CREST_SIZE = 78;

function Column({
  standing,
  live,
  onChange,
}: {
  standing: YearbookStanding | null;
  live: number;
  onChange: () => void;
}) {
  const { t } = useTranslation('tourhub');
  const isTop = standing?.rank === 1;
  const name = standing?.shortName || standing?.collegeName || 'Pick a school';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
      }}
    >
      {/* Crest - unboxed. */}
      <div
        style={{
          width: CREST_SIZE,
          height: CREST_SIZE,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden
      >
        {standing?.logoUrl ? (
          <img
            src={standing.logoUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: isTop
                ? 'drop-shadow(0 6px 24px rgba(255,184,0,0.35))'
                : 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: isTop ? GOLD : '#FFFFFF',
              letterSpacing: '0.04em',
              filter: isTop
                ? 'drop-shadow(0 6px 24px rgba(255,184,0,0.35))'
                : 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))',
            }}
          >
            {(standing?.shortName ?? standing?.collegeName ?? '?').slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          textAlign: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>

      {/* Sub */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: WHITE_ALPHA_65,
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums lining',
          textAlign: 'center',
        }}
      >
        {standing?.rank ? `No.${standing.rank}` : t('college.compare.unranked')}
        {live > 0 && (
          <>
            <span style={{ color: WHITE_ALPHA_30, margin: '0 5px' }}>{'\u00B7'}</span>
            <span style={{ color: STATUS_LIVE_ON_DARK }}>{live} live</span>
          </>
        )}
      </div>

      {/* Change */}
      <button
        type="button"
        onClick={onChange}
        style={{
          marginTop: 2,
          fontFamily: FONT,
          height: 26,
          padding: '0 12px',
          borderRadius: 999,
          background: 'transparent',
          border: '0.75px solid rgba(255,255,255,0.28)',
          color: '#FFFFFF',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        {t('college.compare.change')}
      </button>
    </div>
  );
}

function DuelMastheadInner({ left, right, liveLeft, liveRight, onChangeLeft, onChangeRight }: Props) {
  const { t } = useTranslation('tourhub');
  return (
    <div
      style={{
        background: `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`,
        minHeight: HERO_MIN_H,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: 16,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: AMBER,
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        {t('college.compare.headToHead')}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Column standing={left} live={liveLeft} onChange={onChangeLeft} />
        <div
          aria-hidden
          style={{
            width: 1,
            alignSelf: 'stretch',
            background: 'rgba(255,255,255,0.10)',
            marginTop: 6,
            marginBottom: 6,
          }}
        />
        <Column standing={right} live={liveRight} onChange={onChangeRight} />
      </div>
    </div>
  );
}

export const DuelMasthead = memo(DuelMastheadInner);
export default DuelMasthead;
