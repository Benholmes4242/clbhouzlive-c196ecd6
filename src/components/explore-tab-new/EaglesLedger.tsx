import { useMemo, useState } from 'react';
import {
  useRegionFeats,
  useRegionEagleLeaders,
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
import { LedgerSubline } from './PinIcon';


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
function displayIdentityRow(row: FeatRow): string {
  return (
    formatHolderName(row.holder_name) ||
    (row.holder_username ?? '').trim() ||
    'A member'
  );
}
function displayIdentityLeader(r: {
  holder_name: string | null;
  // leader shape has no username exposed on client type
}): string {
  return formatHolderName(r.holder_name) || 'A member';
}
function extractHoleNo(row: FeatRow): string {
  const s = String(row.feat_value ?? row.value ?? '');
  const m = s.match(/\d+/);
  return m ? m[0] : '—';
}

interface Props {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap?: (row: FeatRow) => void;
  onLeaderTap?: (userId: string) => void;
  /** Rendered inside a merged section that owns the header. */
  hideHeader?: boolean;
  /** Controlled "View all" sheet (used by the merged Moments section). */
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

export function EaglesLedger({
  region,
  mode,
  onRowTap,
  onLeaderTap,
  hideHeader = false,
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
}: Props) {
  const { data: featsData, isLoading } = useRegionFeats(region, 'eagles', 'latest');
  const { data: leadersData } = useRegionEagleLeaders(region);
  const feats = useMemo(() => featsData ?? [], [featsData]);
  const [localSheetOpen, setLocalSheetOpen] = useState(false);
  const controlled = onSheetOpenChange !== undefined;
  const sheetOpen = controlled ? !!sheetOpenProp : localSheetOpen;
  const setSheetOpen = controlled ? onSheetOpenChange! : setLocalSheetOpen;
  const sectionMarginTop = hideHeader ? 0 : 32;

  const leaders = useMemo(
    () =>
      (leadersData ?? [])
        .filter((r) => (r.eagles ?? 0) > 0)
        .sort((a, b) => (b.eagles ?? 0) - (a.eagles ?? 0))
        .slice(0, ROWS),
    [leadersData],
  );

  const hasData = mode === 'alltime' ? leaders.length > 0 : feats.length > 0;
  const overlineLabel = mode === 'alltime' ? 'All-time eagles' : 'Latest eagles';

  if (!isLoading && !hasData) {
    if (region == null) return null;
    return (
      <section style={{ marginTop: sectionMarginTop, fontFamily: FONT }}>
        {hideHeader ? null : <SectionHead overline={overlineLabel} paddingX={14} />}
        <EmptyScopeCard
          title={`No eagles ${regionScopePhrase(region)} yet.`}
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
        {mode === 'alltime'
          ? leaders.map((r, i) => {
              const name = displayIdentityLeader(r);
              return (
                <StatRow
                  key={`${r.user_id ?? name}-${i}`}
                  rank={i + 1}
                  avatarUrl={r.holder_avatar}
                  avatarUserId={r.user_id ?? undefined}
                  name={name}
                  subline={r.holder_club ?? undefined}
                  statValue={r.eagles ?? 0}
                  statLabel="EAGLES"
                  showWatermark={i === 0}
                  isLast={i === leaders.length - 1}
                  density="compact"
                  onPress={() => {
                    if (r.user_id && onLeaderTap) onLeaderTap(r.user_id);
                  }}
                />
              );
            })
          : feats.slice(0, ROWS).map((row, i, arr) => {
              const name = displayIdentityRow(row);
              const when = row.play_date ?? row.attained_at ?? null;
              const sub = (
                <LedgerSubline courseName={row.course_name} when={when ? relativeTime(when) : null} />
              );

              return (
                <StatRow
                  key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                  avatarUrl={row.holder_avatar}
                  avatarUserId={row.user_id}
                  name={name}
                  subline={sub}
                  statValue={extractHoleNo(row)}
                  statLabel="HOLE"
                  isLast={i === arr.length - 1}
                  density="compact"
                  onPress={() => onRowTap?.(row)}
                />
              );
            })}
      </div>

      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="eagles"
        region={region}
        rows={feats}
        onRowTap={onRowTap}
        initialMode={mode}
      />
    </section>
  );
}

export default EaglesLedger;
