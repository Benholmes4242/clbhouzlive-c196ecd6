import { useMemo, useState } from 'react';
import {
  useRegionFeats,
  sortBirdieHauls,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import { SectionHead } from './SectionHead';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { FONT } from './gamingLightTokens';
import { StatRow, StatList } from '@/components/discover/StatRow';

const ROWS = 5;

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A member';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}
function birdieCount(row: FeatRow): number {
  return parseFloat(String(row.feat_value ?? row.value ?? '').replace(/[^\d.]/g, '')) || 0;
}

interface Props {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap?: (row: FeatRow) => void;
}

export function BirdieHaulsLedger({ region, mode, onRowTap }: Props) {
  const { data, isLoading } = useRegionFeats(region, 'birdie_hauls', mode);
  const rows = useMemo(() => sortBirdieHauls(data ?? [], mode), [data, mode]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const display = rows.slice(0, ROWS);

  if (!isLoading && display.length === 0) return null;

  const overlineLabel = mode === 'alltime' ? 'All-time birdie hauls' : 'Latest birdie hauls';

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <SectionHead
        overline={overlineLabel}
        meta="View all"
        onMeta={() => setSheetOpen(true)}
        paddingX={14}
      />

      <div style={{ marginTop: 8 }}>
        <StatList>
          {display.map((row, i) => {
            const name = formatHolderName(row.holder_name);
            const when = row.play_date ?? row.attained_at ?? null;
            const subline = (
              <>
                {row.course_name}
                {when ? ` · ${relativeTime(when)}` : ''}
              </>
            );
            return (
              <StatRow
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                rank={i + 1}
                avatarUrl={row.holder_avatar}
                avatarUserId={row.user_id}
                name={name}
                subline={subline}
                statValue={birdieCount(row)}
                statLabel="BIRDIES"
                onPress={() => onRowTap?.(row)}
              />
            );
          })}
        </StatList>
      </div>

      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="birdie_hauls"
        region={region}
        rows={rows}
        onRowTap={onRowTap}
        initialMode={mode}
      />
    </section>
  );
}

export default BirdieHaulsLedger;
