import { GAM } from '../../../gam/tokens';
import React from 'react';

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
}) => {
  const rowBg = isChampion ? 'var(--hcp-champ-wash, #FFF9EC)' : 'var(--hcp-bg-1, #fff)';
  const photoBg = photoUrl
    ? `url(${photoUrl}) center/cover`
    : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';

  const avatar = isChampion ? (
    <div style={{ width: 40, height: 40, position: 'relative', flexShrink: 0 }} aria-hidden>
      <div style={{ position: 'absolute', inset: 0, background: photoBg, ...squircleMaskStyle }} />
      <div style={{ position: 'absolute', inset: 0, ...squircleMaskStyle, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)' }} />
    </div>
  ) : (
    <div
      aria-hidden
      style={{
        width: 40,
        height: 40,
        borderRadius: '34%',
        background: photoBg,
        boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)',
        flexShrink: 0,
      }}
    />
  );

  const subText = isChampion
    ? holdDuration
    : gapToChampion
      ? `${gapToChampion.replace('-', '−')} from champion`
      : '';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 40px 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 18px',
        background: rowBg,
        boxShadow: 'inset 0 -0.5px 0 rgba(15,23,42,0.07)',
      }}
    >
      <div
        style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: 15,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: rank === 1 ? GAM.AMBER : 'var(--hcp-t-30, #b3bdca)',
          lineHeight: 1,
          textAlign: 'right',
        }}
      >
        {rank}
      </div>

      {avatar}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: isChampion ? 800 : 700,
            color: isSelf ? GAM.DEEP_AMBER : 'var(--hcp-t-100, ' + GAM.INK + ')',
            letterSpacing: '-0.014em',
            lineHeight: 1.25,
            marginBottom: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {isChampion &&
            (isSelf ? (
              <span
                style={{
                  padding: '2px 6px',
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  fontFamily: 'Geist Mono, monospace',
                  background: `linear-gradient(135deg, ${GAM.GOLD}, ${GAM.AMBER})`,
                  color: '#1A1300',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                You
              </span>
            ) : (
              <span
                style={{
                  padding: '2px 6px',
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  fontFamily: 'Geist Mono, monospace',
                  background: 'transparent',
                  color: GAM.DEEP_AMBER,
                  border: `1px solid rgba(178,104,24,0.35)`,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                Champ
              </span>
            ))}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--hcp-t-50, #9aa6b2)',
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
            fontSize: 16,
            fontWeight: 700,
            color: isSelf || isChampion ? GAM.DEEP_AMBER : 'var(--hcp-t-100, ' + GAM.INK + ')',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {valueDisplay}
        </span>
        {unitLabel && (
          <span
            style={{
              fontSize: 9,
              color: 'var(--hcp-t-40, #aab4c0)',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'lowercase',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {unitLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChampionsListRow;
