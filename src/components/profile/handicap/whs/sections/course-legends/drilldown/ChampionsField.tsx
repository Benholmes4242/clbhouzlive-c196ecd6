import React from 'react';

interface FieldRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  isSelf: boolean;
}

interface ChampionsFieldProps {
  rows: FieldRow[];
  totalCount: number;
  onFullLeaderboardTap: () => void;
  maxVisible?: number;
}

const AMBER = '#F7931E';
const GOLD = '#FBBC2E';
const FIELD_BG = '#F8FAFC';
const FIELD_LINE = 'rgba(15,23,42,0.06)';

export const ChampionsField: React.FC<ChampionsFieldProps> = ({
  rows,
  totalCount,
  onFullLeaderboardTap,
  maxVisible = 4,
}) => {
  if (rows.length === 0) {
    return (
      <div style={{ background: FIELD_BG, padding: '14px 16px' }}>
        <div
          style={{
            fontSize: 12.5,
            color: '#94a3b8',
            textAlign: 'center',
            letterSpacing: '0.04em',
            fontWeight: 600,
            padding: 6,
          }}
        >
          The champion stands alone. Be the first to challenge them.
        </div>
      </div>
    );
  }

  const visibleRows = rows.slice(0, maxVisible);
  const hiddenCount = totalCount - 1 - visibleRows.length;

  return (
    <div style={{ background: FIELD_BG, padding: '0 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 0',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          ↘ The field
        </span>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={onFullLeaderboardTap}
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: AMBER,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Full leaderboard ›
          </button>
        )}
      </div>
      {visibleRows.map((row, i) => (
        <div
          key={`${row.rank}-${i}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 36px 1fr auto',
            gap: 12,
            alignItems: 'center',
            padding: '11px 0',
            borderBottom:
              i < visibleRows.length - 1 ? `1px solid ${FIELD_LINE}` : 'none',
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: row.isSelf ? GOLD : '#94a3b8',
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {row.rank}
          </div>
          <div
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: '34%',
              background: row.photoUrl
                ? `url(${row.photoUrl}) center/cover`
                : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
            }}
          />
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: row.isSelf ? GOLD : '#0F172A',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.name}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: row.isSelf ? GOLD : '#0F172A',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.005em',
            }}
          >
            {row.valueDisplay}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChampionsField;
