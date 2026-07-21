import { useMemo } from 'react';
import {
  useRegionFeats,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { FONT } from './gamingLightTokens';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { StatRow } from './StatRow';

const MAX_ROWS = 10;
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
  onRowTap?: (userId: string) => void;
  onLatestRowTap?: (row: FeatRow) => void;
}

// Moments of the game — merged chronological list of aces + albatrosses.
// mode is retained for parity with the section shell but the list is always
// most-recent-first per the unified StatRow spec.
export function AcesAlbatrossesPodium({
  region,
  onLatestRowTap,
}: Props) {
  const { data: latestData } = useRegionFeats(region, 'legendary', 'latest');
  const latest = latestData ?? [];

  const merged = useMemo(() => {
    const dateOf = (r: FeatRow) => r.play_date ?? r.attained_at ?? '';
    return [...latest]
      .filter((r) => {
        const t = (r.feat_type ?? '').toLowerCase();
        return t === 'ace' || t === 'albatross';
      })
      .sort((a, b) => dateOf(b).localeCompare(dateOf(a)))
      .slice(0, MAX_ROWS);
  }, [latest]);

  if (merged.length === 0) {
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
