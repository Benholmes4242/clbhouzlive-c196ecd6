import { useMemo } from 'react';
import {
  useRegionLegendaryLeaders,
  useRegionFeats,
  type LegendaryLeaderRow,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { SC_ACE, SC_ALBATROSS } from '@/features/courses/components/holes/_constants';
import { FONT } from './gamingLightTokens';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { StatRow, StatList, StatListCaption } from '@/components/discover/StatRow';

const MAX_ROWS = 5;
const INK_MUTE = 'rgba(15,23,42,0.55)';
const PAGE_PAD = 14;

type Metric = 'aces' | 'albatrosses';

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A member';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}
function extractHoleNo(row: FeatRow): string | null {
  const s = String(row.feat_value ?? row.value ?? '');
  const m = s.match(/\d+/);
  return m ? m[0] : null;
}

function toLeaders(rows: LegendaryLeaderRow[], metric: Metric): LegendaryLeaderRow[] {
  return rows
    .filter((r) => (r[metric] ?? 0) > 0)
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
    .slice(0, MAX_ROWS);
}
function toLatest(rows: FeatRow[], metric: Metric): FeatRow[] {
  const wanted = metric === 'aces' ? 'ace' : 'albatross';
  const dateOf = (r: FeatRow) => r.play_date ?? r.attained_at ?? '';
  return rows
    .filter((r) => (r.feat_type ?? '').toLowerCase() === wanted)
    .slice()
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)))
    .slice(0, MAX_ROWS);
}

interface Props {
  region: string | null;
  mode: RecordsMode;
  onRowTap?: (userId: string) => void;
  onLatestRowTap?: (row: FeatRow) => void;
}

export function AcesAlbatrossesPodium({
  region,
  mode,
  onRowTap,
  onLatestRowTap,
}: Props) {
  const { data: leaderData } = useRegionLegendaryLeaders(region);
  const { data: latestData } = useRegionFeats(region, 'legendary', 'latest');
  const leaders = leaderData ?? [];
  const latest = latestData ?? [];

  const isAllTime = mode === 'alltime';

  const aceRows = useMemo(
    () => (isAllTime ? toLeaders(leaders, 'aces') : toLatest(latest, 'aces')),
    [isAllTime, leaders, latest],
  );
  const albRows = useMemo(
    () => (isAllTime ? toLeaders(leaders, 'albatrosses') : toLatest(latest, 'albatrosses')),
    [isAllTime, leaders, latest],
  );

  const bothEmpty = aceRows.length === 0 && albRows.length === 0;

  if (bothEmpty) {
    return (
      <div
        style={{
          padding: `18px ${PAGE_PAD}px 0`,
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 500,
          color: INK_MUTE,
        }}
      >
        None yet.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {aceRows.length > 0 ? (
        <>
          <StatListCaption color={SC_ACE}>Aces</StatListCaption>
          <StatList>
            {isAllTime
              ? (aceRows as LegendaryLeaderRow[]).map((r, i) => {
                  const name = formatHolderName(r.holder_name);
                  const count = r.aces ?? 0;
                  return (
                    <StatRow
                      key={`ace-alltime-${r.user_id ?? name}-${i}`}
                      rank={i + 1}
                      avatarUrl={r.holder_avatar}
                      avatarUserId={r.user_id}
                      name={name}
                      statValue={count}
                      statLabel={count === 1 ? 'ACE' : 'ACES'}
                      onPress={() => {
                        if (r.user_id && onRowTap) onRowTap(r.user_id);
                      }}
                    />
                  );
                })
              : (aceRows as FeatRow[]).map((row, i) => {
                  const name = formatHolderName(row.holder_name);
                  const when = row.play_date ?? row.attained_at ?? null;
                  const hole = extractHoleNo(row);
                  return (
                    <StatRow
                      key={`ace-latest-${row.score_id ?? row.course_id ?? i}-${i}`}
                      rank={i + 1}
                      avatarUrl={row.holder_avatar}
                      avatarUserId={row.user_id}
                      name={name}
                      subline={row.course_name}
                      statValue={hole ?? undefined}
                      statLabel={hole ? 'HOLE' : undefined}
                      timestamp={!hole && when ? relativeTime(when) : undefined}
                      onPress={() => onLatestRowTap?.(row)}
                    />
                  );
                })}
          </StatList>
        </>
      ) : null}

      {albRows.length > 0 ? (
        <>
          <StatListCaption color={SC_ALBATROSS}>Albatrosses</StatListCaption>
          <StatList>
            {isAllTime
              ? (albRows as LegendaryLeaderRow[]).map((r, i) => {
                  const name = formatHolderName(r.holder_name);
                  const count = r.albatrosses ?? 0;
                  return (
                    <StatRow
                      key={`alb-alltime-${r.user_id ?? name}-${i}`}
                      rank={i + 1}
                      avatarUrl={r.holder_avatar}
                      avatarUserId={r.user_id}
                      name={name}
                      statValue={count}
                      statLabel={count === 1 ? 'ALBATROSS' : 'ALBATROSSES'}
                      onPress={() => {
                        if (r.user_id && onRowTap) onRowTap(r.user_id);
                      }}
                    />
                  );
                })
              : (albRows as FeatRow[]).map((row, i) => {
                  const name = formatHolderName(row.holder_name);
                  const when = row.play_date ?? row.attained_at ?? null;
                  const hole = extractHoleNo(row);
                  return (
                    <StatRow
                      key={`alb-latest-${row.score_id ?? row.course_id ?? i}-${i}`}
                      rank={i + 1}
                      avatarUrl={row.holder_avatar}
                      avatarUserId={row.user_id}
                      name={name}
                      subline={row.course_name}
                      statValue={hole ?? undefined}
                      statLabel={hole ? 'HOLE' : undefined}
                      timestamp={!hole && when ? relativeTime(when) : undefined}
                      onPress={() => onLatestRowTap?.(row)}
                    />
                  );
                })}
          </StatList>
        </>
      ) : null}
    </div>
  );
}

export default AcesAlbatrossesPodium;
