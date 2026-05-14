import React from 'react';

const FONT_GEIST_MONO = 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace';

interface Props {
  gross: number | null | undefined;
  diffStr: string | null;
}

/**
 * Frosted glass tile inside MiniMedia — GROSS + DIFF micro-stats.
 * Returns null when both values are missing so the photo stands alone.
 */
export const MiniGlass: React.FC<Props> = ({ gross, diffStr }) => {
  const hasGross = gross !== null && gross !== undefined;
  const hasDiff = diffStr !== null;
  if (!hasGross && !hasDiff) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 8,
        padding: '6px 10px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.08)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 1,
            lineHeight: 1,
          }}
        >
          GROSS
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 300,
            color: '#fff',
            fontFamily: FONT_GEIST_MONO,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {hasGross ? gross : '\u2014'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 1,
            lineHeight: 1,
          }}
        >
          DIFF
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: '#F7931E',
            fontFamily: FONT_GEIST_MONO,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {hasDiff ? diffStr : '\u2014'}
        </span>
      </div>
    </div>
  );
};

export default MiniGlass;
