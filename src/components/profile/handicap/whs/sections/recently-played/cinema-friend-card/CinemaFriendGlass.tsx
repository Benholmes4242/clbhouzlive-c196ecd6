import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';
import { splitCourseName } from '../../last-round-card/splitCourseName';
import CinemaCardShapeStrip from '../../last-round-card/CinemaCardShapeStrip';
import { fmtDiff } from '@/lib/whs/format';
import { GlassGrossRing } from '../../shared/GrossCounterRing';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const AMBER = '#F7931E';
const EM_DASH = '\u2014';

interface Props {
  courseName: string | null;
  par: number | null;
  slope: number | null;
  gross: number | null;
  stableford: number | null;
  differential: number | null;
  holes: WhsScoreHole[] | null;
  isCounter?: boolean;
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
  fontSize: 24,
  fontWeight: 300,
  color,
  fontFamily: FONT_MONO,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  marginTop: 2,
  fontVariantNumeric: 'tabular-nums',
});

export const CinemaFriendGlass: React.FC<Props> = ({
  courseName,
  par,
  slope,
  gross,
  stableford,
  differential,
  holes,
  isCounter = false,
}) => {
  const { title, suffix } = splitCourseName(courseName ?? 'Round played');
  const meta = [
    suffix,
    par != null ? `PAR ${par}` : null,
    slope != null ? `SL ${slope}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  const showShape = !!holes && holes.length > 0;

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.08)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        fontFamily: FONT_GEIST,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            minWidth: 0,
            flex: 1,
          }}
        >
          {title}
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.10)',
            border: '0.5px solid rgba(255,255,255,0.25)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.10em',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          SCORECARD
          <span style={{ fontSize: 10, opacity: 0.7 }}>{'\u203A'}</span>
        </span>
      </div>
      {meta && (
        <div
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.60)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {meta}
        </div>
      )}

      <div style={{ ...HAIR, margin: '10px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={labelStyle}>GROSS</div>
          <div
            style={{ marginTop: 3 }}
            aria-label={`Gross score ${gross ?? ''}${isCounter ? ', counts toward index' : ''}`}
          >
            <GlassGrossRing
              value={gross != null ? gross : EM_DASH}
              isCounter={isCounter}
              numeralSize={28}
            />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={labelStyle}>STABLEFORD</div>
          <div style={valueStyle('#FFFFFF')}>{stableford != null ? stableford : EM_DASH}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>SCORE DIFF</div>
          <div style={valueStyle(differential != null ? AMBER : '#FFFFFF')}>
            {differential != null ? fmtDiff(differential, { plus: true }) : EM_DASH}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CinemaFriendGlass;
