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
import { DiscoverYouStripMount } from './DiscoverYouStripMount';
import { LedgerSubline } from './PinIcon';

import { slugToCacheRegion } from './regionScope';


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
  /** Rendered inside a merged section that owns the header. */
  hideHeader?: boolean;
  /** Controlled "View all" sheet (used by the merged Moments section). */
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

export function BirdieHaulsLedger({
  region,
  mode,
  onRowTap,
  hideHeader = false,
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
}: Props) {
  const { data, isLoading } = useRegionFeats(region, 'birdie_hauls', mode);
  const rows = useMemo(() => sortBirdieHauls(data ?? [], mode), [data, mode]);
  const [localSheetOpen, setLocalSheetOpen] = useState(false);
  const controlled = onSheetOpenChange !== undefined;
  const sheetOpen = controlled ? !!sheetOpenProp : localSheetOpen;
  const setSheetOpen = controlled ? onSheetOpenChange! : setLocalSheetOpen;
  const sectionMarginTop = hideHeader ? 0 : 32;

  const display = rows.slice(0, ROWS);
  const overlineLabel = mode === 'alltime' ? 'All-time birdie hauls' : 'Latest birdie hauls';

  if (!isLoading && display.length === 0) {
    if (region == null) return null;
    return (
      <section style={{ marginTop: sectionMarginTop, fontFamily: FONT }}>
        {hideHeader ? null : <SectionHead overline={overlineLabel} paddingX={14} />}
        <EmptyScopeCard
          title={`No birdie hauls ${regionScopePhrase(region)} yet.`}
          subline="This region is unconquered — be the first."
        />
      </section>
    );
  }

  return (
    <section style={{ marginTop: sectionMarginTop, fontFamily: FONT }}>
      {hideHeader ? null : (
        <SectionHead
          overline={overlineLabel}
          meta="View all"
          onMeta={() => setSheetOpen(true)}
          paddingX={14}
        />
      )}


      <div>
        {display.map((row, i) => {
          const name = displayIdentity(row);
          const count = birdieCount(row);
          const when = row.play_date ?? row.attained_at ?? null;
          const sub = (
            <LedgerSubline courseName={row.course_name} when={when ? relativeTime(when) : null} />
          );

          return (
            <StatRow
              key={`${row.score_id ?? row.course_id ?? i}-${i}`}
              rank={mode === 'alltime' ? i + 1 : undefined}
              avatarUrl={row.holder_avatar}
              avatarUserId={row.user_id}
              name={name}
              subline={sub}
              statValue={count}
              statLabel="BIRDIES"
              showWatermark={mode === 'alltime' && i === 0}
              isLast={i === display.length - 1}
              density="compact"
              onPress={() => onRowTap?.(row)}
            />
          );
        })}
      </div>

      {/* G2 wiring — YouStrip under Latest Birdie Hauls only.
          Flag DISCOVER_YOU_STRIP OFF → renders nothing. */}
      {mode === 'latest' ? (
        <DiscoverYouStripMount
          railKey={`feats:${slugToCacheRegion(region)}:birdie_hauls`}
          emptyMessage="Post a round to appear on the birdie board"
        />
      ) : null}



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
