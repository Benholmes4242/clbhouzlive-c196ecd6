import { useMemo } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SPACE } from '@/lib/spacing';
import { FONT } from './gamingLightTokens';
import {
  useRegionLegendaryLeaders,
  type LegendaryLeaderRow,
} from './hooks/useRegionFeats';
import {
  SC_ACE,
  SC_ALBATROSS,
  SC_ACE_DARK,
  SC_ALBATROSS_DARK,
  SC_FILL_GOLD,
} from '@/features/courses/components/holes/_constants';

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const RANK_MUTE = 'rgba(15,23,42,0.35)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const BAR_TRACK = 'rgba(15,23,42,0.07)';
const CARD_BG = '#FFFFFF';
const HOUSE_AMBER = '#F7931E';
const MAX_ROWS = 5;

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

interface BoardProps {
  title: string;
  accent: string;
  rows: LegendaryLeaderRow[];
  metric: 'aces' | 'albatrosses';
  onViewAll?: (metric: 'aces' | 'albatrosses') => void;
}

function Board({ title, accent, rows, metric, onViewAll }: BoardProps) {
  const filtered = useMemo(
    () =>
      rows
        .filter((r) => (r[metric] ?? 0) > 0)
        .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
        .slice(0, MAX_ROWS),
    [rows, metric],
  );

  const boardMax = filtered[0]?.[metric] ?? 1;
  const barGradient =
    metric === 'aces'
      ? `linear-gradient(90deg, ${SC_ACE}, ${SC_FILL_GOLD})`
      : `linear-gradient(90deg, ${SC_ALBATROSS}, ${SC_ALBATROSS_DARK})`;
  // SC_ACE_DARK reserved for future dark-theme variant; keep import stable.
  void SC_ACE_DARK;

  const hasHolders = filtered.length > 0;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: CARD_BG,
        borderRadius: 16,
        boxShadow: '0 2px 14px rgba(15,23,42,0.06)',
        border: `0.5px solid ${HAIRLINE}`,
        padding: '14px 12px 10px',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: accent,
          textTransform: 'uppercase',
          padding: '0 4px 10px',
        }}
      >
        {title}
      </div>
      {!hasHolders ? (
        <div
          style={{
            padding: '28px 8px',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: INK_MUTE,
          }}
        >
          None yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((r, i) => {
            const name = formatHolderName(r.holder_name);
            const rank = i + 1;
            const isTop = rank === 1;
            const count = r[metric] ?? 0;
            const pct = Math.max(0.08, Math.min(1, count / (boardMax || 1)));

            const rowInner = (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      fontSize: 13,
                      fontWeight: isTop ? 800 : 700,
                      color: isTop ? accent : RANK_MUTE,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {rank}
                  </div>
                  <SquircleAvatar
                    size={26}
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
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: INK,
                      letterSpacing: '-0.005em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: isTop ? 800 : 900,
                      color: isTop ? accent : INK,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {count}
                  </div>
                </div>
                {/* Count bar */}
                <div
                  style={{
                    marginTop: 6,
                    marginLeft: 26,
                    height: 3.5,
                    borderRadius: 999,
                    background: BAR_TRACK,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct * 100}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: barGradient,
                      transition: 'width .35s cubic-bezier(.2,.8,.2,1)',
                    }}
                  />
                </div>
              </>
            );

            if (isTop) {
              return (
                <div
                  key={`${r.user_id ?? name}-${i}`}
                  style={{
                    borderRadius: 12,
                    padding: '9px 8px',
                    border: '1px solid rgba(255,210,0,0.5)',
                    background:
                      'linear-gradient(120deg, rgba(255,210,0,0.12), rgba(255,210,0,0.02))',
                    marginBottom: 2,
                  }}
                >
                  {rowInner}
                </div>
              );
            }

            return (
              <div
                key={`${r.user_id ?? name}-${i}`}
                style={{
                  padding: '8px 4px',
                  borderTop: `0.5px solid ${HAIRLINE}`,
                }}
              >
                {rowInner}
              </div>
            );
          })}
          {onViewAll && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 6,
              }}
            >
              <button
                type="button"
                onClick={() => onViewAll(metric)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '4px 6px',
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 800,
                  color: HOUSE_AMBER,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                }}
              >
                View all {'\u203A'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  region: string | null;
  onViewAll?: (metric: 'aces' | 'albatrosses') => void;
}

export function LegendaryLeadersBoards({ region, onViewAll }: Props) {
  const { data } = useRegionLegendaryLeaders(region);
  const rows = data ?? [];

  return (
    <div
      style={{
        padding: `0 ${SPACE.pagePadX}px`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {/* Wrap so each board is min ~280px; single-col below ~600px viewport. */}
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex' }}>
        <Board
          title="Most Aces"
          accent={SC_ACE}
          rows={rows}
          metric="aces"
          onViewAll={onViewAll}
        />
      </div>
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex' }}>
        <Board
          title="Most Albatrosses"
          accent={SC_ALBATROSS}
          rows={rows}
          metric="albatrosses"
          onViewAll={onViewAll}
        />
      </div>
    </div>
  );
}

export default LegendaryLeadersBoards;
