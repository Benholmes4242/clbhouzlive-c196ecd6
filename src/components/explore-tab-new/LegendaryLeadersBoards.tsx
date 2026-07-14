import { useMemo } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SPACE } from '@/lib/spacing';
import { FONT } from './gamingLightTokens';
import {
  useRegionLegendaryLeaders,
  type LegendaryLeaderRow,
} from './hooks/useRegionFeats';

const GOLD = '#FBBC2E';
const AMBER = '#F59E0B';
const PURPLE = '#8B5CF6';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const MAX_ROWS = 10;

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
}

function Board({ title, accent, rows, metric }: BoardProps) {
  const filtered = useMemo(
    () =>
      rows
        .filter((r) => (r[metric] ?? 0) > 0)
        .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
        .slice(0, MAX_ROWS),
    [rows, metric],
  );

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
      {filtered.length === 0 ? (
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
            const rankColor = rank === 1 ? GOLD : INK;
            const count = r[metric] ?? 0;
            return (
              <div
                key={`${r.user_id ?? name}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 4px',
                  borderTop: i === 0 ? 'none' : `0.5px solid ${HAIRLINE}`,
                }}
              >
                <div
                  style={{
                    width: 18,
                    fontSize: 13,
                    fontWeight: 700,
                    color: rankColor,
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
                    fontWeight: 800,
                    color: accent,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Props {
  region: string | null;
}

export function LegendaryLeadersBoards({ region }: Props) {
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
        <Board title="Most Aces" accent={AMBER} rows={rows} metric="aces" />
      </div>
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex' }}>
        <Board
          title="Most Albatrosses"
          accent={PURPLE}
          rows={rows}
          metric="albatrosses"
        />
      </div>
    </div>
  );
}

export default LegendaryLeadersBoards;
