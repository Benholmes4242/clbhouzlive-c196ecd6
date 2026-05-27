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
  const rowBg = isChampion
    ? 'var(--hcp-champ-wash, #FFF8EA)'
    : 'var(--hcp-bg-1, #fff)';
  const borderColor = isChampion
    ? 'var(--hcp-champ-wash-border-light, rgba(247,147,30,0.20))'
    : 'var(--hcp-line, rgba(15,23,42,0.05))';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 44px 1fr auto',
        gap: 12,
        alignItems: 'center',
        padding: '12px 16px',
        background: rowBg,
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <div
        style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: 18,
          fontWeight: 800,
          color: isChampion
            ? '#F7931E'
            : isSelf
              ? 'var(--hcp-accent-celebrate, #C97211)'
              : 'var(--hcp-t-40, #94a3b8)',
          letterSpacing: '-0.015em',
          lineHeight: 1,
        }}
      >
        {rank}
      </div>

      <div
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: '34%',
          background: photoUrl
            ? `url(${photoUrl}) center/cover`
            : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
          flexShrink: 0,
        }}
      />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: isSelf
              ? 'var(--hcp-accent-celebrate, #C97211)'
              : 'var(--hcp-t-100, #0F172A)',
            letterSpacing: '-0.012em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {name}
          {isChampion && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px 5px',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                borderRadius: 3,
                fontFamily: 'Geist Mono, monospace',
                ...(isSelf
                  ? {
                      background: 'linear-gradient(135deg, #FBBC2E 0%, #F7931E 100%)',
                      color: '#1A1300',
                    }
                  : {
                      background: 'rgba(15,23,42,0.06)',
                      color: 'var(--hcp-t-60, #475569)',
                      border: '1px solid rgba(15,23,42,0.10)',
                    }),
              }}
            >
              {isSelf ? 'YOU' : 'CHAMP'}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--hcp-t-60, #64748b)',
            fontWeight: 500,
            letterSpacing: '-0.005em',
          }}
        >
          {isChampion ? holdDuration : gapToChampion ? `${gapToChampion} from champion` : ''}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: isSelf
              ? 'var(--hcp-accent-celebrate, #C97211)'
              : isChampion
                ? 'var(--hcp-accent-celebrate, #C97211)'
                : 'var(--hcp-t-100, #0F172A)',
            letterSpacing: '-0.015em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        >
          {valueDisplay}
        </div>
        {unitLabel && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--hcp-t-40, #94a3b8)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: 2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {unitLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChampionsListRow;
