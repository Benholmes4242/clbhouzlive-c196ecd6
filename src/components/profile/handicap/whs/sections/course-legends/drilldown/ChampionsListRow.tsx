import { GAM } from '../../../gam/tokens';
import React from 'react';
import { Crown } from 'lucide-react';

interface ChampionsListRowProps {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  unitLabel: string;
  isSelf: boolean;
  isChampion: boolean;
  gapToChampion: string | null;
  holdDuration: string | null;
  isNew?: boolean;
  /** Compact variant for inline duel-card top-5 lists. */
  compact?: boolean;
}

const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";
const squircleMaskStyle: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_MASK_URL,
  maskImage: SQUIRCLE_MASK_URL,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

export const ChampionsListRow: React.FC<ChampionsListRowProps> = ({
  rank,
  name,
  photoUrl,
  valueDisplay,
  unitLabel,
  isSelf,
  isChampion,
  gapToChampion,
  holdDuration,
  isNew = false,
  compact = false,
}) => {
  const rowBg = isSelf
    ? 'var(--hcp-tint-2)'
    : isChampion
      ? 'var(--hcp-bg-2)'
      : 'var(--hcp-bg-1)';
  const photoBg = photoUrl
    ? `url(${photoUrl}) center/cover`
    : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';

  const avatarSize = compact ? 32 : 40;

  const avatar = isChampion ? (
    <div style={{ width: avatarSize, height: avatarSize, position: 'relative', flexShrink: 0 }} aria-hidden>
      <div style={{ position: 'absolute', inset: 0, background: photoBg, ...squircleMaskStyle }} />
      <div style={{ position: 'absolute', inset: 0, ...squircleMaskStyle, boxShadow: 'inset 0 0 0 1px var(--hcp-line)' }} />
    </div>
  ) : (
    <div
      aria-hidden
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: '34%',
        background: photoBg,
        boxShadow: 'inset 0 0 0 1px var(--hcp-line)',
        flexShrink: 0,
      }}
    />
  );

  const subText = isChampion
    ? holdDuration
    : gapToChampion
      ? `${gapToChampion.replace('-', '−')} from champion`
      : '';

  const padY = compact ? '7px' : '10px';
  const nameSize = compact ? 14 : 15;
  const valueSize = compact ? 14.5 : 16;

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: compact ? '18px 32px 1fr auto' : '24px 40px 1fr auto',
        gap: compact ? 12 : 14,
        alignItems: 'center',
        padding: `${padY} 16px`,
        background: rowBg,
        boxShadow: 'inset 0 -0.5px 0 var(--hcp-line)',
      }}
    >
      {rank === 1 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', lineHeight: 0 }} aria-label="Champion">
          <Crown size={15} strokeWidth={2.5} fill={GAM.GOLD} style={{ color: GAM.DEEP_AMBER, flexShrink: 0 }} />
        </div>
      ) : (
        <div
          style={{
            fontFamily: GAM.FONT_GEIST,
            fontSize: compact ? 13 : 15,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--hcp-t-30)',
            lineHeight: 1,
            textAlign: 'right',
          }}
        >
          {rank}
        </div>
      )}

      {avatar}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: nameSize,
            fontWeight: isChampion ? 800 : 600,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.014em',
            lineHeight: 1.25,
            marginBottom: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {isNew && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: '#16A34A',
                background: 'rgba(34,197,94,0.10)',
                padding: '1px 5px',
                borderRadius: 4,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              New
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--hcp-t-60)',
            fontWeight: 500,
            letterSpacing: '-0.003em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {subText}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span
          style={{
            fontFamily: GAM.FONT_GEIST,
            fontSize: valueSize,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {valueDisplay}
        </span>
      </div>
    </div>
  );
};

export default ChampionsListRow;
