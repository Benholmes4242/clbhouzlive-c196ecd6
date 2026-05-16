import React from 'react';
import { MiniGrossRing } from '../../shared/GrossCounterRing';

const FONT_GEIST_MONO = 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace';

interface Props {
  gross: number | null | undefined;
  diffStr: string | null;
  isCounter?: boolean;
}

/**
 * Frosted glass tile inside MiniMedia — GROSS + DIFF micro-stats.
 * Returns null when both values are missing so the photo stands alone.
 */
export const MiniGlass: React.FC<Props> = ({ gross, diffStr: _diffStr, isCounter = false }) => {
  const hasGross = gross !== null && gross !== undefined;
  if (!hasGross) return null;

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
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
          aria-label={`Gross score ${gross}${isCounter ? ', counts toward index' : ''}`}
        >
          <MiniGrossRing value={gross as number} isCounter={isCounter} />
        </span>
      </div>
    </div>
  );
};

export default MiniGlass;
