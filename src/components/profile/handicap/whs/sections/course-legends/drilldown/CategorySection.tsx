import React, { useState } from 'react';
import { type LucideIcon } from 'lucide-react';
import { ChampionCard } from './ChampionCard';
import { CompactLeaderRow } from './CompactLeaderRow';
import { SeeFullFooter } from './SeeFullFooter';

interface SectionRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
}

interface Props {
  categoryLabel: string;
  categoryIcon: LucideIcon;
  unit: string;
  rows: SectionRow[];
  totalCount: number;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const DEFAULT_VISIBLE = 5;

export const CategorySection: React.FC<Props> = ({
  categoryLabel,
  categoryIcon: CatIcon,
  unit,
  rows,
  totalCount,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  const champion = rows[0];
  const restAll = rows.slice(1);
  const restVisible = expanded ? restAll : restAll.slice(0, DEFAULT_VISIBLE - 1);
  const visibleCount = 1 + restVisible.length;
  const hiddenCount = totalCount - visibleCount;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'var(--hcp-bg-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--hcp-t-80)',
            flexShrink: 0,
          }}
        >
          <CatIcon size={15} strokeWidth={2.4} />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.01em',
            flex: 1,
          }}
        >
          {categoryLabel}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--hcp-t-40)',
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      <ChampionCard categoryIcon={CatIcon} unit={unit} row={champion} />

      {restVisible.length > 0 && (
        <div
          style={{
            marginTop: 8,
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line)',
            borderRadius: 12,
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {restVisible.map((row, i) => (
            <React.Fragment key={`${row.rank}-${i}`}>
              <CompactLeaderRow row={row} unit={unit} />
              {i < restVisible.length - 1 && (
                <div style={{ height: 1, background: 'var(--hcp-line)', margin: '0 8px' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <SeeFullFooter hiddenCount={hiddenCount} onClick={() => setExpanded(true)} />
    </div>
  );
};
