import React from 'react';
import { Lock } from 'lucide-react';
import type { WhsScoreHole } from '@/lib/whs/types';
import { splitCourseName } from '../../last-round-card/splitCourseName';
import CinemaCardShapeStrip from '../../last-round-card/CinemaCardShapeStrip';
import { GlassGrossRing } from '../../shared/GrossCounterRing';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = "Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
const AMBER = '#F7931E';
const MINUS = '\u2212';
const EM_DASH = '\u2014';

const lockedLabelStyle: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.40)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontFamily: FONT_GEIST,
  marginBottom: 3,
};

const LockedTile: React.FC<{ label: string; align?: 'left' | 'right' | 'center' }> = ({
  label,
  align = 'center',
}) => (
  <div style={{ textAlign: align }} aria-label={`${label} locked — invite friend to clbhouz to unlock`}>
    <div style={lockedLabelStyle}>{label}</div>
    <div
      style={{
        marginTop: 3,
        width: 29,
        height: 29,
        borderRadius: 6,
        border: '1px dashed rgba(255,255,255,0.20)',
        background: 'rgba(255,255,255,0.06)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Lock size={11} color="rgba(255,255,255,0.45)" strokeWidth={2} />
    </div>
  </div>
);


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
  /** When non-null and |delta| >= 0.05, renders 4th stat HCP IMPACT in a 2×2 grid. */
  handicapDelta?: number | null;
  /** When true, missing Stableford and Score Diff render as dashed lock tiles (non-clbhouz friends). */
  lockMissingStats?: boolean;
}


const HAIR: React.CSSProperties = {
  height: 0,
  borderTop: '0.5px solid rgba(255,255,255,0.15)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.55)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontFamily: FONT_GEIST,
  marginBottom: 2,
};

const valueStyle = (color: string, size: number = 22): React.CSSProperties => ({
  fontSize: size,
  fontWeight: 300,
  color,
  fontFamily: FONT_MONO,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  marginTop: 2,
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
  handicapDelta = null,
  lockMissingStats = false,
}) => {

  const { title, suffix } = splitCourseName(courseName);
  const hasImpact =
    handicapDelta != null && Math.abs(handicapDelta) >= 0.05;
  const impactColor = hasImpact
    ? handicapDelta! < 0
      ? '#34D399'
      : '#f87171'
    : '#FFFFFF';
  const valSize = hasImpact ? 18 : 22;
  const ringSize = hasImpact ? 18 : 22;
  const fmtImpact = (d: number): string => {
    const r = Math.round(d * 10) / 10;
    if (r > 0) return `+${r.toFixed(1)}`;
    if (r < 0) return `${MINUS}${Math.abs(r).toFixed(1)}`;
    return '0.0';
  };
  const meta = metaOverride
    ? null
    : [
        suffix,
        par != null ? `PAR ${par}` : null,
        slope != null ? `SLOPE ${slope}` : null,
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
        bottom: 14,
        zIndex: 3,
        padding: '10px 13px',
        borderRadius: 13,
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
            fontSize: 14,
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
              marginTop: 2,
              fontSize: 8,
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

      <div style={{ ...HAIR, margin: '8px 0' }} />

      <div
        style={
          hasImpact
            ? {
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                columnGap: 8,
                alignItems: 'start',
              }
            : { display: 'flex', justifyContent: 'space-between', alignItems: 'start' }
        }
      >
        <div style={{ textAlign: 'center', flex: hasImpact ? undefined : 1 }}>
          <div style={labelStyle}>GROSS</div>
          <div
            style={{ marginTop: 4, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label={`Gross score ${gross ?? ''}${isCounter ? ', counts toward index' : ''}`}
          >
            <GlassGrossRing
              value={gross != null ? gross : EM_DASH}
              isCounter={isCounter}
              numeralSize={ringSize}
            />
          </div>
        </div>
        {lockMissingStats ? (
          <div style={{ flex: hasImpact ? undefined : 1, textAlign: 'center' }}>
            <LockedTile label="STABLEFORD" align="center" />
          </div>
        ) : (
          <div style={{ textAlign: 'center', flex: hasImpact ? undefined : 1 }}>
            <div style={labelStyle}>STABLEFORD</div>
            <div style={{ marginTop: 4, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ ...valueStyle('#FFFFFF', valSize), marginTop: 0 }}>{stableford != null ? stableford : EM_DASH}</div>
            </div>
          </div>
        )}
        {lockMissingStats ? (
          <div style={{ flex: hasImpact ? undefined : 1, textAlign: 'center' }}>
            <LockedTile label="SCORE DIFF" align="center" />
          </div>
        ) : (
          <div style={{ textAlign: 'center', flex: hasImpact ? undefined : 1 }}>
            <div style={labelStyle}>SCORE DIFF</div>
            <div style={{ marginTop: 4, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ ...valueStyle('#FFFFFF', valSize), marginTop: 0 }}>
                {fmtDiffLocal(differential)}
              </div>
            </div>
          </div>
        )}

        {hasImpact && (
          <div style={{ textAlign: 'center' }}>
            <div style={labelStyle}>HCP IMPACT</div>
            <div style={{ marginTop: 4, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ ...valueStyle(impactColor, valSize), marginTop: 0 }}>{fmtImpact(handicapDelta!)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetHeroGlass;
