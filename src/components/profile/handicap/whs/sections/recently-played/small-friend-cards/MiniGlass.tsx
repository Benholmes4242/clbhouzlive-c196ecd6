import React from 'react';
import { MiniGrossRing } from '../../shared/GrossCounterRing';

interface Props {
  gross: number | null | undefined;
  diffStr: string | null;
  isCounter?: boolean;
}

/**
 * Compact frosted GROSS chip pinned to the bottom-right of MiniMedia.
 * Returns null when gross is missing so the photo stands alone.
 */
export const MiniGlass: React.FC<Props> = ({ gross, diffStr: _diffStr, isCounter = false }) => {
  const hasGross = gross !== null && gross !== undefined;
  if (!hasGross) return null;

  return (
    <div
      style={{
        position: 'absolute',
        right: 5,
        bottom: 5,
        padding: '2px 5px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.10)',
        border: '0.5px solid rgba(255,255,255,0.20)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontSize: 7,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 1,
          lineHeight: 1,
        }}
      >
        GROSS
      </span>
      <span aria-label={`Gross score ${gross}${isCounter ? ', counts toward index' : ''}`}>
        <MiniGrossRing value={gross as number} isCounter={isCounter} />
      </span>
    </div>
  );
};

export default MiniGlass;
