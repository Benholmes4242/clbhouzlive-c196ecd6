/**
 * DuelMasthead — charcoal head for the compare page.
 *
 * HEAD TO HEAD eyebrow (amber, centered) · two symmetric columns:
 * crest 54 (gold treatment when franchise rank 1), school 13/800 white,
 * "No.{rank} · {n} live" sub (green when live > 0), "Change" ghost button
 * that opens the PickerSheet for that side.
 *
 * ~215px tall + safe-area padding at the top.
 */

import { memo } from 'react';
import type { YearbookStanding } from '@/features/tourhub/college-v2/hub/data/useFranchiseStandings';
import {
  AMBER,
  CHARCOAL,
  FONT,
  GOLD,
  GOLD_DEEP,
  STATUS_LIVE,
  WHITE_ALPHA_18,
  WHITE_ALPHA_55,
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

function Column({
  standing,
  live,
  onChange,
}: {
  standing: YearbookStanding | null;
  live: number;
  onChange: () => void;
}) {
  const isTop = standing?.rank === 1;
  const name = standing?.shortName || standing?.collegeName || '—';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {/* Crest */}
      <div
        style={{
          position: 'relative',
          width: 54,
          height: 54,
          boxShadow: isTop ? '0 3px 10px rgba(255,184,0,0.20)' : 'none',
        }}
        aria-hidden
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 6,
          }}
        >
          {standing?.logoUrl ? (
            <img src={standing.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 12, fontWeight: 900, color: isTop ? GOLD : '#FFF', letterSpacing: '0.04em' }}>
              {(standing?.shortName ?? standing?.collegeName ?? '?').slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        {/* Traced canonical hairline (dark hero). Rank-1 keeps its gold status ring. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            border: isTop ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.22)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.01em',
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
          fontSize: 10.5,
          fontWeight: 700,
          color: live > 0 ? STATUS_LIVE : WHITE_ALPHA_65,
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
        }}
      >
        {standing?.rank ? `No.${standing.rank}` : '—'}
        {live > 0 && (
          <>
            <span style={{ color: WHITE_ALPHA_55, margin: '0 5px' }}>{'\u00B7'}</span>
            <span>{live} live</span>
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
          height: 22,
          padding: '0 10px',
          borderRadius: 999,
          background: 'transparent',
          border: `0.75px solid ${WHITE_ALPHA_18}`,
          color: '#FFFFFF',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Change
      </button>
    </div>
  );
}

function DuelMastheadInner({ left, right, liveLeft, liveRight, onChangeLeft, onChangeRight }: Props) {
  return (
    <div
      style={{
        background: `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 58px)',
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: 16,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: AMBER,
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        Head to Head
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
      {/* Suppress unused-var noise for GOLD_DEEP (reserved for future rank-1 accents). */}
      <span style={{ display: 'none' }} data-g={GOLD_DEEP} />
    </div>
  );
}

export const DuelMasthead = memo(DuelMastheadInner);
export default DuelMasthead;
