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
import { StatRow } from './StatRow';
import { regionScopePhrase } from './regionScope';
import { EmptyScopeCard } from './EmptyScopeCard';

const ROWS = 5;

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return '';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}
function displayIdentity(row: FeatRow): string {
  return (
    formatHolderName(row.holder_name) ||
    (row.holder_username ?? '').trim() ||
    'A member'
  );
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
  const scoped = useMemo(
    () => (data ?? []).filter((r) => matchesRailRegionScope(region, r.region)),
    [data, region],
  );
  const rows = useMemo(() => sortBirdieHauls(scoped, mode), [scoped, mode]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const display = rows.slice(0, ROWS);
  const overlineLabel = mode === 'alltime' ? 'All-time birdie hauls' : 'Latest birdie hauls';

  if (!isLoading && display.length === 0) {
    if (region == null) return null;
    return (
      <section style={{ marginTop: 32, fontFamily: FONT }}>
        <SectionHead overline={overlineLabel} paddingX={14} />
        <EmptyScopeCard
          title={`No birdie hauls ${regionScopePhrase(region)} yet.`}
          subline="This region is unconquered — be the first."
        />
      </section>
    );
  }

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <SectionHead
        overline={overlineLabel}
        meta="View all"
        onMeta={() => setSheetOpen(true)}
        paddingX={14}
      />

      <div>
        {display.map((row, i) => {
          const name = displayIdentity(row);
          const count = birdieCount(row);
          const when = row.play_date ?? row.attained_at ?? null;
          const sub = [row.course_name, when ? relativeTime(when) : null]
            .filter(Boolean)
            .join(' · ');
          return (
            <StatRow
              key={`${row.score_id ?? row.course_id ?? i}-${i}`}
              rank={i + 1}
              avatarUrl={row.holder_avatar}
              avatarUserId={row.user_id}
              name={name}
              subline={sub}
              statValue={count}
              statLabel="BIRDIES"
              showWatermark={i === 0}
              isLast={i === display.length - 1}
              onPress={() => onRowTap?.(row)}
            />
          );
        })}
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
