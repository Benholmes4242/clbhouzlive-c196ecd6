import { useMemo } from 'react';
import {
  useRegionFeats,
  useRegionLegendaryLeaders,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { FONT } from './gamingLightTokens';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { StatRow } from './StatRow';
import { formatHcp } from '@/lib/formatHcp';

const MAX_ROWS = 3;
const INK_MUTE = 'rgba(15,23,42,0.55)';
const PAGE_PAD = 14;

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

interface Props {
  region: string | null;
  mode: RecordsMode;
  metric?: 'aces' | 'albatrosses';
  onRowTap?: (userId: string) => void;
  onLatestRowTap?: (row: FeatRow) => void;
}

// Moments of the game.
//  - Recent mode: merged chronological list of aces + albatrosses.
//  - All-time mode: count leaders for the selected metric (aces | albatrosses).
export function AcesAlbatrossesPodium({
  region,
  mode,
  metric = 'aces',
  onRowTap,
  onLatestRowTap,
}: Props) {
  const isAllTime = mode === 'alltime';
  const { data: latestData } = useRegionFeats(region, 'legendary', 'latest');
  const { data: leadersData } = useRegionLegendaryLeaders(region);

  const merged = useMemo(() => {
    if (isAllTime) return [];
    const latest = latestData ?? [];
    const dateOf = (r: FeatRow) => r.play_date ?? r.attained_at ?? '';
    return [...latest]
      .filter((r) => {
        const t = (r.feat_type ?? '').toLowerCase();
        return t === 'ace' || t === 'albatross';
      })
      .sort((a, b) => dateOf(b).localeCompare(dateOf(a)))
      .slice(0, MAX_ROWS);
  }, [isAllTime, latestData]);

  const leaders = useMemo(() => {
    if (!isAllTime) return [];
    return (leadersData ?? [])
      .filter((r) => (r[metric] ?? 0) > 0)
      .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
      .slice(0, MAX_ROWS);
  }, [isAllTime, leadersData, metric]);

  const empty = isAllTime ? leaders.length === 0 : merged.length === 0;
  if (empty) {
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

  if (isAllTime) {
    const singular = metric === 'aces' ? 'HOLE IN ONE' : 'ALBATROSS';
    const plural = metric === 'aces' ? 'HOLES IN ONE' : 'ALBATROSSES';
    return (
      <div style={{ fontFamily: FONT }}>
        {leaders.map((r, i) => {
          const count = r[metric] ?? 0;
          const other = metric === 'aces' ? (r.albatrosses ?? 0) : (r.aces ?? 0);
          const otherLabel =
            other > 0
              ? metric === 'aces'
                ? `+${other} ${other === 1 ? 'albatross' : 'albatrosses'}`
                : `+${other} ${other === 1 ? 'ace' : 'aces'}`
              : null;
          const parts: string[] = [];
          if (otherLabel) parts.push(otherLabel);
          if (r.holder_club) parts.push(r.holder_club);
          const combined = parts.join(' \u00B7 ');
          const name = formatHolderName(r.holder_name) || 'A member';
          return (
            <StatRow
              key={`${r.user_id ?? name}-${i}`}
              rank={i + 1}
              avatarUrl={r.holder_avatar}
              avatarUserId={r.user_id ?? null}
              name={name}
              subline={combined || undefined}
              statValue={count}
              statLabel={count === 1 ? singular : plural}
              showWatermark={i === 0}
              isLast={i === leaders.length - 1}
              density="compact"
              onPress={r.user_id && onRowTap ? () => onRowTap(r.user_id!) : undefined}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {merged.map((row, i) => {
        const name = displayIdentity(row);
        const when = row.play_date ?? row.attained_at ?? null;
        const isAce = (row.feat_type ?? '').toLowerCase() === 'ace';
        const canTap = !!(row.score_id || row.user_id);
        return (
          <StatRow
            key={`${row.score_id ?? row.course_id ?? i}-${i}`}
            avatarUrl={row.holder_avatar}
            avatarUserId={row.user_id}
            name={name}
            subline={row.course_name ?? undefined}
            chip={{ label: isAce ? 'HOLE IN ONE' : 'ALBATROSS', tone: isAce ? 'ace' : 'albatross' }}
            timestamp={when ? relativeTime(when) : undefined}
            isLast={i === merged.length - 1}
            density="compact"
            onPress={
              canTap && onLatestRowTap
                ? () => onLatestRowTap(row)
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

export default AcesAlbatrossesPodium;
