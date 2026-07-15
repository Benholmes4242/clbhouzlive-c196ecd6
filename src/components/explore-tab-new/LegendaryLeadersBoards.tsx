import { useMemo } from 'react';
import { SPACE } from '@/lib/spacing';
import { CountLeadersBoard, type CountLeaderRow } from './CountLeadersBoard';
import {
  useRegionLegendaryLeaders,
  type LegendaryLeaderRow,
} from './hooks/useRegionFeats';
import {
  SC_ACE,
  SC_ALBATROSS,
  SC_ACE_DARK,
  SC_ALBATROSS_DARK,
  SC_FILL_GOLD,
} from '@/features/courses/components/holes/_constants';

// SC_ACE_DARK reserved for future dark-theme variant; keep import stable.
void SC_ACE_DARK;

const ACE_GRADIENT = `linear-gradient(90deg, ${SC_ACE}, ${SC_FILL_GOLD})`;
const ALBATROSS_GRADIENT = `linear-gradient(90deg, ${SC_ALBATROSS}, ${SC_ALBATROSS_DARK})`;

function toCountRows(rows: LegendaryLeaderRow[], metric: 'aces' | 'albatrosses'): CountLeaderRow[] {
  return rows
    .filter((r) => (r[metric] ?? 0) > 0)
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
    .map((r) => ({
      user_id: r.user_id,
      holder_name: r.holder_name,
      holder_avatar: r.holder_avatar,
      count: r[metric] ?? 0,
    }));
}

interface Props {
  region: string | null;
  onViewAll?: (metric: 'aces' | 'albatrosses') => void;
}

export function LegendaryLeadersBoards({ region, onViewAll }: Props) {
  const { data } = useRegionLegendaryLeaders(region);
  const rows = data ?? [];
  const aceRows = useMemo(() => toCountRows(rows, 'aces'), [rows]);
  const albatrossRows = useMemo(() => toCountRows(rows, 'albatrosses'), [rows]);

  return (
    <div
      style={{
        padding: `0 ${SPACE.pagePadX}px`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex' }}>
        <CountLeadersBoard
          title="Most Aces"
          accent={SC_ACE}
          barGradient={ACE_GRADIENT}
          rows={aceRows}
          onViewAll={onViewAll ? () => onViewAll('aces') : undefined}
        />
      </div>
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex' }}>
        <CountLeadersBoard
          title="Most Albatrosses"
          accent={SC_ALBATROSS}
          barGradient={ALBATROSS_GRADIENT}
          rows={albatrossRows}
          onViewAll={onViewAll ? () => onViewAll('albatrosses') : undefined}
        />
      </div>
    </div>
  );
}

export default LegendaryLeadersBoards;
