import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useTitlesInReach, type TitleInReach } from '@/hooks/gam/useTitlesInReach';

import {
  SCOREBOARD_BG,
  GOLD,
  AMBER,
  FONT,
  CARD_RADIUS,
} from './gamingLightTokens';

// Reused from the old WhereYoudRank component (copied verbatim before deletion).
const CATEGORY_META: Record<string, { label: string; unit: string; style: 'off' | 'back' }> = {
  lowest_gross: { label: 'Gross', unit: 'strokes', style: 'off' },
  best_score_diff: { label: 'Score', unit: 'strokes', style: 'off' },
  most_birdies: { label: 'Birdies', unit: 'birdies', style: 'back' },
  best_stableford: { label: 'Stableford', unit: 'points', style: 'back' },
  most_eagles: { label: 'Eagles', unit: 'eagles', style: 'back' },
  most_aces: { label: 'Hole-in-one', unit: 'aces', style: 'back' },
  most_rounds: { label: 'Most rounds', unit: 'rounds', style: 'back' },
};

const LOWER_IS_BETTER = new Set(['lowest_gross', 'best_score_diff']);

function stripWindow(category: string): string {
  return category.replace(/_(90d|all_time)$/, '');
}

function gapCopy(category: string, gap: number): string {
  const base = stripWindow(category);
  const meta = CATEGORY_META[base];
  const n = Math.max(0, Math.round(gap));
  if (!meta) return `${n} off the record`;
  return meta.style === 'off'
    ? `${n} ${meta.unit}`
    : `${n} ${meta.unit}`;
}

function categoryLabel(category: string): string {
  const base = stripWindow(category);
  return (CATEGORY_META[base]?.label ?? base.replace(/_/g, ' ')).toUpperCase();
}

function progressPct(category: string, userValue: number, leaderValue: number): number {
  const base = stripWindow(category);
  if (userValue <= 0 || leaderValue <= 0) return 6;
  const raw = LOWER_IS_BETTER.has(base)
    ? leaderValue / userValue
    : userValue / leaderValue;
  return Math.max(6, Math.min(96, Math.round(raw * 100)));
}

function ConquestCard({ row }: { row: TitleInReach }) {
  const navigate = useNavigate();
  const pct = progressPct(row.category, row.user_value, row.leader_value);
  const gap = gapCopy(row.category, row.gap);
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${row.course_id}?tab=legends`)}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 250,
        borderRadius: CARD_RADIUS,
        background: SCOREBOARD_BG,
        padding: '13px 14px',
        border: '1px solid rgba(247,147,30,0.2)',
        cursor: 'pointer',
        fontFamily: FONT,
        color: '#fff',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: AMBER,
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {categoryLabel(row.category)} · {row.course_name}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 25,
          fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        #{row.user_rank}
      </div>
      <div
        style={{
          marginTop: 10,
          height: 6,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #E8800C, #FFCB45)',
            borderRadius: 3,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 10.5,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.3,
        }}
      >
        <span style={{ color: GOLD, fontWeight: 800 }}>{gap}</span>
        {' '}to take the record ({row.leader_value})
      </div>
    </button>
  );
}

interface Props {
  userId: string | undefined;
}

export function NextConquestsRail({ userId }: Props) {
  const { user } = useSupabaseSession();
  const effectiveUserId = userId ?? user?.id;
  const { data: connection } = useWhsConnection(effectiveUserId);
  const { data } = useTitlesInReach(effectiveUserId);

  const seedRef = useRef(Math.random());
  const picks = useMemo(() => {
    if (!data || data.length === 0) return [];
    const seen = new Set<string>();
    const unique: TitleInReach[] = [];
    for (const row of data) {
      if (seen.has(row.course_id)) continue;
      seen.add(row.course_id);
      unique.push(row);
    }
    let s = Math.floor(seedRef.current * 2 ** 32) || 1;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const arr = unique.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 6);
  }, [data]);

  if (!effectiveUserId || !connection) return null;
  if (picks.length === 0) return null;

  return (
    <div
      className="flex overflow-x-auto scrollbar-hide"
      style={{ padding: '0 16px', gap: 9 }}
    >
      {picks.map((row) => (
        <ConquestCard key={`${row.course_id}-${row.category}`} row={row} />
      ))}
    </div>
  );
}

export default NextConquestsRail;
