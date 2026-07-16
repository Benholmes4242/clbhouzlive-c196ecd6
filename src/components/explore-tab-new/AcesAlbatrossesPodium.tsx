import { useMemo } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SC_ACE, SC_ALBATROSS, SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import {
  useRegionLegendaryLeaders,
  useRegionFeats,
  type LegendaryLeaderRow,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { FONT } from './gamingLightTokens';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const PODIUM_ROWS = 3;

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}
function initials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

type Metric = 'aces' | 'albatrosses';

function toLeaders(rows: LegendaryLeaderRow[], metric: Metric): LegendaryLeaderRow[] {
  return rows
    .filter((r) => (r[metric] ?? 0) > 0)
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
    .slice(0, PODIUM_ROWS);
}

function toLatest(rows: FeatRow[], metric: Metric): FeatRow[] {
  const wanted = metric === 'aces' ? 'ace' : 'albatross';
  const dateOf = (r: FeatRow) => r.play_date ?? r.attained_at ?? '';
  return rows
    .filter((r) => (r.feat_type ?? '').toLowerCase() === wanted)
    .slice()
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)))
    .slice(0, PODIUM_ROWS);
}

interface Props {
  region: string | null;
  mode: RecordsMode;
  onViewAll: (metric: Metric) => void;
  onRowTap?: (userId: string) => void;
  onLatestRowTap?: (row: FeatRow) => void;
}

export function AcesAlbatrossesPodium({
  region,
  mode,
  onViewAll,
  onRowTap,
  onLatestRowTap,
}: Props) {
  const { data: leaderData } = useRegionLegendaryLeaders(region);
  const { data: latestData } = useRegionFeats(region, 'legendary', 'latest');
  const leaders = leaderData ?? [];
  const latest = latestData ?? [];

  const aceLeaderRows = useMemo(() => toLeaders(leaders, 'aces'), [leaders]);
  const albLeaderRows = useMemo(() => toLeaders(leaders, 'albatrosses'), [leaders]);
  const aceLatestRows = useMemo(() => toLatest(latest, 'aces'), [latest]);
  const albLatestRows = useMemo(() => toLatest(latest, 'albatrosses'), [latest]);

  const isAllTime = mode === 'alltime';

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '0 16px',
        fontFamily: FONT,
      }}
    >
      {isAllTime ? (
        <>
          <LeaderPodiumCard
            title="Most aces"
            accent={SC_ACE}
            rows={aceLeaderRows}
            metric="aces"
            onViewAll={() => onViewAll('aces')}
            onRowTap={onRowTap}
          />
          <LeaderPodiumCard
            title="Most albatrosses"
            accent={SC_ALBATROSS}
            rows={albLeaderRows}
            metric="albatrosses"
            onViewAll={() => onViewAll('albatrosses')}
            onRowTap={onRowTap}
          />
        </>
      ) : (
        <>
          <LatestPodiumCard
            title="Latest aces"
            accent={SC_ACE}
            rows={aceLatestRows}
            onViewAll={() => onViewAll('aces')}
            onRowTap={onLatestRowTap}
          />
          <LatestPodiumCard
            title="Latest albatrosses"
            accent={SC_ALBATROSS}
            rows={albLatestRows}
            onViewAll={() => onViewAll('albatrosses')}
            onRowTap={onLatestRowTap}
          />
        </>
      )}
    </div>
  );
}

function CardShell({
  title,
  accent,
  onViewAll,
  children,
}: {
  title: string;
  accent: string;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: CARD_BG,
        borderRadius: 16,
        border: `0.5px solid ${HAIRLINE}`,
        boxShadow: CARD_SHADOW,
        padding: '12px 12px 10px',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          padding: '0 2px 10px',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: accent,
            lineHeight: 1,
          }}
        >
          {title}
        </div>
        <button
          type="button"
          onClick={onViewAll}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: AMBER,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONT,
          }}
        >
          All ›
        </button>
      </div>
      {children}
    </div>
  );
}

function EmptyBoard() {
  return (
    <div
      style={{
        padding: '22px 4px',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: INK_MUTE,
      }}
    >
      None yet
    </div>
  );
}

function LeaderPodiumCard({
  title,
  accent,
  rows,
  metric,
  onViewAll,
  onRowTap,
}: {
  title: string;
  accent: string;
  rows: LegendaryLeaderRow[];
  metric: Metric;
  onViewAll: () => void;
  onRowTap?: (userId: string) => void;
}) {
  return (
    <CardShell title={title} accent={accent} onViewAll={onViewAll}>
      {rows.length === 0 ? (
        <EmptyBoard />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((r, i) => {
            const isTop = i === 0;
            const name = formatHolderName(r.holder_name);
            const count = r[metric] ?? 0;
            const size = isTop ? 32 : 26;
            const nameSize = isTop ? 12.5 : 11.5;
            const countSize = isTop ? 15 : 12.5;
            const countColor = isTop ? accent : INK;
            const unitSingular = metric === 'aces' ? 'ACE' : 'ALBATROSS';
            const unitPlural = metric === 'aces' ? 'ACES' : 'ALBATROSSES';
            const unit = count === 1 ? unitSingular : unitPlural;
            const handleTap = () => {
              if (r.user_id && onRowTap) onRowTap(r.user_id);
            };
            return (
              <button
                key={`${r.user_id ?? name}-${i}`}
                type="button"
                onClick={handleTap}
                className="text-left active:opacity-80 transition-opacity"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: 0,
                  paddingTop: isTop ? 0 : 7,
                  marginTop: isTop ? 0 : 8,
                  border: 'none',
                  background: 'transparent',
                  backgroundImage: isTop
                    ? 'none'
                    : `linear-gradient(to right, transparent 35px, ${HAIRLINE} 35px)`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '100% 0.5px',
                  backgroundPosition: '0 0',
                  cursor: r.user_id ? 'pointer' : 'default',
                  fontFamily: FONT,
                }}
              >
                <SquircleAvatar
                  size={size}
                  srcCandidates={r.holder_avatar ? [r.holder_avatar] : []}
                  alt={name}
                  fallback={initials(name)}
                  userId={r.user_id}
                  hairlineRing
                  ringColor={isTop ? SC_FILL_GOLD : LIGHT_HAIRLINE}
                />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: nameSize,
                      fontWeight: 600,
                      letterSpacing: isTop ? '-0.01em' : 0,
                      color: INK,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      marginTop: 1,
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 4,
                      lineHeight: 1.2,
                    }}
                  >
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: countSize,
                        fontWeight: 700,
                        color: countColor,
                      }}
                    >
                      {count}
                    </span>
                    <span
                      style={{
                        fontSize: 8.5,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'rgba(15,23,42,0.4)',
                      }}
                    >
                      {unit}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

function LatestPodiumCard({
  title,
  accent,
  rows,
  onViewAll,
  onRowTap,
}: {
  title: string;
  accent: string;
  rows: FeatRow[];
  onViewAll: () => void;
  onRowTap?: (row: FeatRow) => void;
}) {
  return (
    <CardShell title={title} accent={accent} onViewAll={onViewAll}>
      {rows.length === 0 ? (
        <EmptyBoard />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((r, i) => {
            const isFirst = i === 0;
            const name = formatHolderName(r.holder_name);
            const when = r.play_date ?? r.attained_at ?? null;
            const canTap = !!(r.score_id || r.user_id);
            const handleTap = () => {
              if (canTap && onRowTap) onRowTap(r);
            };
            return (
              <button
                key={`${r.score_id ?? r.user_id ?? name}-${i}`}
                type="button"
                onClick={handleTap}
                className="text-left active:opacity-80 transition-opacity"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: 0,
                  paddingTop: isFirst ? 0 : 7,
                  marginTop: isFirst ? 0 : 8,
                  border: 'none',
                  background: 'transparent',
                  backgroundImage: isFirst
                    ? 'none'
                    : `linear-gradient(to right, transparent 35px, ${HAIRLINE} 35px)`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '100% 0.5px',
                  backgroundPosition: '0 0',
                  cursor: canTap ? 'pointer' : 'default',
                  fontFamily: FONT,
                }}
              >
                <SquircleAvatar
                  size={26}
                  srcCandidates={r.holder_avatar ? [r.holder_avatar] : []}
                  alt={name}
                  fallback={initials(name)}
                  userId={r.user_id}
                  hairlineRing
                  ringColor={LIGHT_HAIRLINE}
                />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: INK,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      marginTop: 1,
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'rgba(15,23,42,0.45)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}
                  >
                    {r.course_name}
                    {when ? ` · ${relativeTime(when)}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

export default AcesAlbatrossesPodium;
