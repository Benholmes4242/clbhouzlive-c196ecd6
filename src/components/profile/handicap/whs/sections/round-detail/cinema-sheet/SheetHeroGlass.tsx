import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';
import { splitCourseName } from '../../last-round-card/splitCourseName';
import CinemaCardShapeStrip from '../../last-round-card/CinemaCardShapeStrip';
import { GlassGrossRing } from '../../shared/GrossCounterRing';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = "Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
const AMBER = '#F7931E';
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
  /** Override meta line (e.g. invite-state amber meta). When omitted, default suffix · PAR · SL is rendered. */
  metaOverride?: React.ReactNode;
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
  marginBottom: 4,
};

const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: 36,
  fontWeight: 300,
  color,
  fontFamily: FONT_MONO,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  marginTop: 4,
  fontVariantNumeric: 'tabular-nums',
});

function fmtDiffLocal(d: number | null): string {
  if (d == null) return EM_DASH;
  const r = Math.round(d * 10) / 10;
  if (r === 0) return '0.0';
  if (r > 0) return `+${r.toFixed(1)}`;
  return `${MINUS}${Math.abs(r).toFixed(1)}`;
}

export const SheetHeroGlass: React.FC<Props> = ({
  courseName,
  par,
  slope,
  gross,
  stableford,
  differential,
  holes,
  metaOverride,
  isCounter = false,
}) => {
  const { title, suffix } = splitCourseName(courseName);
  const meta = metaOverride
    ? null
    : [
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
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 16,
        zIndex: 3,
        padding: '16px 18px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.08)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        fontFamily: FONT_GEIST,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {metaOverride}
        {meta && (
          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.60)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {meta}
          </div>
        )}
      </div>

      <div style={{ ...HAIR, margin: '14px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={labelStyle}>GROSS</div>
          <div
            style={{ marginTop: 4 }}
            aria-label={`Gross score ${gross ?? ''}${isCounter ? ', counts toward index' : ''}`}
          >
            <GlassGrossRing
              value={gross != null ? gross : EM_DASH}
              isCounter={isCounter}
              numeralSize={32}
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
            {fmtDiffLocal(differential)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetHeroGlass;
