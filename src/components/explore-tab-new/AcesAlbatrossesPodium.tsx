import { useMemo } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { SC_ACE, SC_ALBATROSS } from '@/features/courses/components/holes/_constants';
import {
  useRegionLegendaryLeaders,
  useRegionFeats,
  type LegendaryLeaderRow,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { FONT } from './gamingLightTokens';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const BAND_BG = 'rgba(15,23,42,0.035)';
const PAGE_PAD = 14;

const MAX_ROWS = 5;
const CELL_MIN_H = 52;

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

  const bandCount = Math.min(
    MAX_ROWS,
    Math.max(1, Math.max(aceRows.length, albRows.length)),
  );

  return (
    <div style={{ fontFamily: FONT, color: INK }}>
      {/* Column captions — centered over the two 50% columns */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: 10,
          paddingBottom: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'center',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: SC_ACE,
            lineHeight: 1,
          }}
        >
          Aces
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'center',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: SC_ALBATROSS,
            lineHeight: 1,
          }}
        >
          Albatrosses
        </div>
      </div>

      {/* Table zone — full-bleed rules + stripes */}
      <div style={{ borderTop: `0.5px solid ${HAIRLINE}` }}>
        {Array.from({ length: bandCount }).map((_, i) => {
          const banded = i % 2 === 1; // bands 2 and 4
          const aceRow = aceRows[i];
          const albRow = albRows[i];
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'stretch',
                background: banded ? BAND_BG : 'transparent',
                borderBottom: `0.5px solid ${HAIRLINE}`,
                minHeight: CELL_MIN_H,
              }}
            >
              <ColumnCell
                mode={isAllTime ? 'alltime' : 'latest'}
                index={i}
                accent={SC_ACE}
                metric="aces"
                leader={isAllTime ? (aceRow as LegendaryLeaderRow | undefined) : undefined}
                feat={isAllTime ? undefined : (aceRow as FeatRow | undefined)}
                columnEmpty={aceRows.length === 0}
                onLeaderTap={onRowTap}
                onFeatTap={onLatestRowTap}
              />
              <ColumnCell
                mode={isAllTime ? 'alltime' : 'latest'}
                index={i}
                accent={SC_ALBATROSS}
                metric="albatrosses"
                leader={isAllTime ? (albRow as LegendaryLeaderRow | undefined) : undefined}
                feat={isAllTime ? undefined : (albRow as FeatRow | undefined)}
                columnEmpty={albRows.length === 0}
                onLeaderTap={onRowTap}
                onFeatTap={onLatestRowTap}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ColumnCell({
  mode,
  index,
  accent,
  metric,
  leader,
  feat,
  columnEmpty,
  onLeaderTap,
  onFeatTap,
}: {
  mode: 'alltime' | 'latest';
  index: number;
  accent: string;
  metric: Metric;
  leader?: LegendaryLeaderRow;
  feat?: FeatRow;
  columnEmpty: boolean;
  onLeaderTap?: (userId: string) => void;
  onFeatTap?: (row: FeatRow) => void;
}) {
  // "None yet." only on the first row of a fully-empty column
  if (columnEmpty) {
    return (
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: '9px 14px',
          display: 'flex',
          alignItems: 'center',
          fontSize: 11,
          fontWeight: 500,
          color: INK_MUTE,
        }}
      >
        {index === 0 ? 'None yet.' : ''}
      </div>
    );
  }

  // Populated in some rows but not this one -> striped empty cell
  if (mode === 'alltime' ? !leader : !feat) {
    return <div style={{ flex: 1, minWidth: 0, padding: '9px 14px' }} aria-hidden />;
  }

  if (mode === 'alltime' && leader) {
    const isTop = index === 0;
    const name = formatHolderName(leader.holder_name);
    const count = leader[metric] ?? 0;
    const avatarSize = isTop ? 24 : 20;
    const countColor = isTop ? accent : INK;
    const unitSingular = metric === 'aces' ? 'ACE' : 'ALBATROSS';
    const unitPlural = metric === 'aces' ? 'ACES' : 'ALBATROSSES';
    const unit = count === 1 ? unitSingular : unitPlural;
    const canTap = !!leader.user_id;
    const handleTap = () => {
      if (canTap && onLeaderTap) onLeaderTap(leader.user_id!);
    };
    return (
      <button
        type="button"
        onClick={handleTap}
        className="text-left active:opacity-80 transition-opacity"
        style={{
          flex: 1,
          minWidth: 0,
          padding: '9px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 3,
          background: 'transparent',
          border: 'none',
          cursor: canTap ? 'pointer' : 'default',
          fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <GoldRingAvatar
            size={avatarSize}
            srcCandidates={leader.holder_avatar ? [leader.holder_avatar] : []}
            alt={name}
            fallback={initials(name)}
            userId={leader.user_id}
          />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '-0.01em',
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
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
                lineHeight: 1.2,
              }}
            >
              <span
                className="tabular-nums"
                style={{ fontSize: 13, fontWeight: 700, color: countColor }}
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
        </div>
      </button>
    );
  }

  // Latest cell
  if (feat) {
    const name = formatHolderName(feat.holder_name);
    const when = feat.play_date ?? feat.attained_at ?? null;
    const canTap = !!(feat.score_id || feat.user_id);
    const handleTap = () => {
      if (canTap && onFeatTap) onFeatTap(feat);
    };
    return (
      <button
        type="button"
        onClick={handleTap}
        className="text-left active:opacity-80 transition-opacity"
        style={{
          flex: 1,
          minWidth: 0,
          padding: '9px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 3,
          background: 'transparent',
          border: 'none',
          cursor: canTap ? 'pointer' : 'default',
          fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <GoldRingAvatar
            size={20}
            srcCandidates={feat.holder_avatar ? [feat.holder_avatar] : []}
            alt={name}
            fallback={initials(name)}
            userId={feat.user_id}
          />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {name}
              </div>
              {when ? (
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'rgba(15,23,42,0.4)',
                    lineHeight: 1.2,
                  }}
                >
                  {relativeTime(when)}
                </div>
              ) : null}
            </div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                color: 'rgba(15,23,42,0.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {feat.course_name ?? ''}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return <div style={{ flex: 1, minWidth: 0 }} aria-hidden />;
}

export default AcesAlbatrossesPodium;
