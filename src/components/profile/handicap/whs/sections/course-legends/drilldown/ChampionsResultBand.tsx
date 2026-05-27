import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface ChampionsResultBandProps {
  categoryLabel: string;
  categoryIcon: LucideIcon;
  championName: string;
  championPhotoUrl: string | null;
  valueDisplay: string;
  unitLabel: string;
  isSelf: boolean;
}

const INK = '#0F1822';
const AMBER = '#F7931E';
const GOLD = '#FBBC2E';

export const ChampionsResultBand: React.FC<ChampionsResultBandProps> = ({
  categoryLabel,
  categoryIcon: CatIcon,
  championName,
  championPhotoUrl,
  valueDisplay,
  unitLabel,
  isSelf,
}) => (
  <>
    <div style={{ height: 3, background: AMBER }} aria-hidden />
    <div
      style={{
        background: INK,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          border: `2px solid ${AMBER}`,
          boxShadow: '0 0 0 4px rgba(247,147,30,0.10)',
          background: championPhotoUrl
            ? `url(${championPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginBottom: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <CatIcon size={11} strokeWidth={2.4} />
          {categoryLabel}
        </div>
        <div
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: isSelf ? GOLD : '#FFFFFF',
            letterSpacing: '-0.022em',
            lineHeight: 1.0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {championName}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 200,
            color: GOLD,
            letterSpacing: '-0.03em',
            lineHeight: 0.95,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right',
          }}
        >
          {valueDisplay}
        </div>
        {unitLabel && (
          <div
            style={{
              fontSize: 10.5,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
              textAlign: 'right',
              marginTop: 4,
            }}
          >
            {unitLabel}
          </div>
        )}
      </div>
    </div>
  </>
);

export default ChampionsResultBand;
