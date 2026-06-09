import { GAM } from '../../../gam/tokens';
import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { ChampionsListRow } from './ChampionsListRow';

interface RowData {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  isSelf: boolean;
  gapToChampion: string | null;
  userId?: string | null;
}

interface ChampionsCategorySectionProps {
  categoryLabel: string;
  categoryIcon: LucideIcon;
  unitLabel: string;
  totalCount: number;
  holdDuration: string;
  rows: RowData[];
  maxVisible?: number;
  onFullLeaderboardTap: () => void;
}

export const ChampionsCategorySection: React.FC<ChampionsCategorySectionProps> = ({
  categoryLabel,
  categoryIcon: CatIcon,
  unitLabel,
  totalCount,
  holdDuration,
  rows,
  maxVisible = 4,
  onFullLeaderboardTap,
}) => {
  const visible = rows.slice(0, maxVisible);
  const hiddenCount = totalCount - visible.length;

  if (visible.length === 0) return null;

  const Eyebrow = (
    <div
      style={{
        padding: '20px 18px 6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <CatIcon size={11} strokeWidth={2.4} />
        {categoryLabel}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--hcp-t-40)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {holdDuration}
      </div>
    </div>
  );

  if (visible.length === 1) {
    return (
      <div data-category-section>
        {Eyebrow}
        <ChampionsListRow
          rank={visible[0].rank}
          name={visible[0].name}
          photoUrl={visible[0].photoUrl}
          valueDisplay={visible[0].valueDisplay}
          unitLabel={unitLabel}
          isSelf={visible[0].isSelf}
          isChampion={true}
          gapToChampion={null}
          holdDuration={holdDuration}
        />
        <div
          style={{
            padding: '12px 18px 16px',
            fontSize: 11,
            color: 'var(--hcp-t-60, #94a3b8)',
            textAlign: 'center',
            fontStyle: 'italic',
            fontWeight: 500,
          }}
        >
          The champion stands alone. Be the first to challenge.
        </div>
      </div>
    );
  }

  return (
    <div data-category-section>
      {Eyebrow}
      {visible.map((row, i) => (
        <ChampionsListRow
          key={`${row.rank}-${i}`}
          rank={row.rank}
          name={row.name}
          photoUrl={row.photoUrl}
          valueDisplay={row.valueDisplay}
          unitLabel={unitLabel}
          isSelf={row.isSelf}
          isChampion={i === 0}
          gapToChampion={i === 0 ? null : row.gapToChampion}
          holdDuration={i === 0 ? holdDuration : null}
        />
      ))}
      {hiddenCount > 0 && (
        <div style={{ padding: '12px 18px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onFullLeaderboardTap}
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--hcp-t-100)',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Full leaderboard <span style={{ fontSize: 12 }}>›</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChampionsCategorySection;

