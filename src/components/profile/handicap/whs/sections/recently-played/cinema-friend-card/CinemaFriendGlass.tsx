import React from 'react';
import { Lock } from 'lucide-react';

import type { WhsScoreHole } from '@/lib/whs/types';
import { GlassGrossRing } from '../../shared/GrossCounterRing';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
function diffOnPhotoColor(_d: number | null): string {
  return '#FFFFFF';
}
const MINUS = '\u2212';
const EM_DASH = '\u2014';

interface Props {
  courseName: string;
  par: number | null;
  slope: number | null;
  gross: number | null;
  stableford: number | null;
  differential: number | null;
  holes: WhsScoreHole[] | null;
  isCounter?: boolean;
  /** Hide stableford & score diff columns; show invite pill bottom-right. */
  nonEnriched?: boolean;
  onInviteClick?: () => void;
  inviteLabel?: string;
}

const HAIR: React.CSSProperties = {
  height: 0,
  borderTop: '0.5px solid rgba(255,255,255,0.15)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.55)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontFamily: FONT_GEIST,
};

const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: 30,
  fontWeight: 300,
  color,
  fontFamily: FONT_GEIST,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  marginTop: 4,
  fontVariantNumeric: 'tabular-nums',
});

function fmtDiff(d: number | null): string {
  if (d == null) return EM_DASH;
  const rounded = Math.round(d * 10) / 10;
  if (rounded === 0) return '0.0';
  if (rounded > 0) return `+${rounded.toFixed(1)}`;
  return `${MINUS}${Math.abs(rounded).toFixed(1)}`;
}

/**
 * Flow-positioned glass block used by morning-moment HeroCard.
 * Mirrors CinemaCardGlass visuals but lives inside a relative parent.
 */
export const CinemaFriendGlass: React.FC<Props> = ({
  courseName,
  par,
  slope,
  gross,
  stableford,
  differential,
  isCounter = false,
  nonEnriched = false,
  onInviteClick,
  inviteLabel = 'Invite',
}) => {
  const meta = [
    par != null ? `PAR ${par}` : null,
    slope != null ? `SL ${slope}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.08)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        fontFamily: FONT_GEIST,
      }}
    >
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {courseName}
      </div>
      {meta && (
        <div
          style={{
            marginTop: 3,
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.60)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {meta}
        </div>
      )}

      <div style={{ ...HAIR, margin: '10px 0' }} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={labelStyle}>GROSS</div>
          <div
            style={{ marginTop: 4 }}
            aria-label={`Gross score ${gross ?? ''}${isCounter ? ', counts toward index' : ''}`}
          >
            <GlassGrossRing
              value={gross != null ? gross : EM_DASH}
              isCounter={isCounter}
              numeralSize={26}
            />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={labelStyle}>STABLEFORD</div>
          {nonEnriched ? (
            <div style={{ ...valueStyle('rgba(255,255,255,0.55)'), display: 'flex', justifyContent: 'center', alignItems: 'center', height: 30 }}>
              <Lock size={18} strokeWidth={2} />
            </div>
          ) : (
            <div style={valueStyle('#FFFFFF')}>{stableford != null ? stableford : EM_DASH}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>SCORE DIFF</div>
          {nonEnriched ? (
            <div style={{ ...valueStyle('rgba(255,255,255,0.55)'), display: 'flex', justifyContent: 'center', alignItems: 'center', height: 30 }}>
              <Lock size={18} strokeWidth={2} />
            </div>
          ) : (
            <div style={valueStyle(diffOnPhotoColor(differential))}>
              {fmtDiff(differential)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CinemaFriendGlass;
