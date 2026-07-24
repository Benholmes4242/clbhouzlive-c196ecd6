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
import { slugToCacheRegion } from './regionScope';


const ROWS = 3;

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
  /** Parent (FeatsSection) owns the SectionHead + section spacing. */
  embedded?: boolean;
  /** Controlled sheet (used when embedded). */
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

export function BirdieHaulsLedger({
  region,
  mode,
  onRowTap,
  embedded = false,
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
}: Props) {
  const { data, isLoading } = useRegionFeats(region, 'birdie_hauls', mode);
  const rows = useMemo(() => sortBirdieHauls(data ?? [], mode), [data, mode]);
  const [localSheetOpen, setLocalSheetOpen] = useState(false);

  const controlled = typeof onSheetOpenChange === 'function';
  const sheetOpen = controlled ? !!sheetOpenProp : localSheetOpen;
  const setSheetOpen = (open: boolean) => {
    if (controlled) onSheetOpenChange!(open);
    else setLocalSheetOpen(open);
  };

  const display = rows.slice(0, ROWS);
  const overlineLabel = mode === 'alltime' ? 'All-time birdie hauls' : 'Latest birdie hauls';
  const sectionStyle = { marginTop: embedded ? 0 : 32, fontFamily: FONT } as const;

  if (!isLoading && display.length === 0) {
    if (region == null) return null;
    return (
      <section style={sectionStyle}>
        {!embedded && <SectionHead overline={overlineLabel} paddingX={14} />}
        <EmptyScopeCard
          title={`No birdie hauls ${regionScopePhrase(region)} yet.`}
          subline={'This region is unconquered \u2014 be the first.'}
        />
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      {!embedded && (
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
          const sub = [row.course_name, when ? relativeTime(when) : null]
            .filter(Boolean)
            .join(' · ');
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
