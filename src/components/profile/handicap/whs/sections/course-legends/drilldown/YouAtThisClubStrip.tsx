import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = 'var(--hcp-t-100)';
const MUTE = 'var(--hcp-t-60)';
const AMBER = 'var(--hcp-amber)';
const HAIRLINE = 'var(--hcp-line)';

interface UnderThreatRow {
  category: string;
  course_id: string;
}
interface TitleInReachRow {
  course_id: string;
  category: string;
  gap: number;
}
interface CrownActivityRow {
  changes_30d: number | null;
  last_change_at: string | null;
}

const NEAREST_MISS_META: Record<
  string,
  { unit: string; unitSingular: string; decimals: number }
> = {
  lowest_gross:     { unit: 'strokes', unitSingular: 'stroke', decimals: 0 },
  best_score_diff:  { unit: '',        unitSingular: '',       decimals: 1 },
  most_birdies:     { unit: 'birdies', unitSingular: 'birdie', decimals: 0 },
  best_stableford:  { unit: 'points',  unitSingular: 'point',  decimals: 0 },
  most_eagles:      { unit: 'eagles',  unitSingular: 'eagle',  decimals: 0 },
  most_aces:        { unit: 'aces',    unitSingular: 'ace',    decimals: 0 },
  most_albatrosses: { unit: 'albatrosses', unitSingular: 'albatross', decimals: 0 },
  most_rounds:      { unit: 'rounds',  unitSingular: 'round',  decimals: 0 },
};

function stripWindow(cat: string): string {
  return cat.replace(/_(90d|all_time)$/, '');
}

function formatNearestMiss(category: string, gap: number): string {
  const meta = NEAREST_MISS_META[stripWindow(category)];
  if (!meta) return `${gap} from a crown`;
  const v = meta.decimals > 0 ? gap.toFixed(meta.decimals) : String(Math.max(1, Math.round(gap)));
  const isOne = meta.decimals === 0 && Math.max(1, Math.round(gap)) === 1;
  const unit = isOne ? meta.unitSingular : meta.unit;
  if (!unit) return `${v} from a crown`;
  return `${v} ${unit} from a crown`;
}

interface Props {
  userId: string | undefined;
  courseId: string;
  theme?: 'light' | 'dark';
  /** When provided, overrides the strip's own RPC-derived crown count so it stays in sync with the cabinet's window-scoped fraction. */
  heldCountOverride?: number;
}

export const YouAtThisClubStrip: React.FC<Props> = ({ userId, courseId, theme = 'dark', heldCountOverride }) => {

  const { data: crowns } = useQuery({
    queryKey: ['course-legends', 'crowns-held-here', userId ?? 'anon', courseId],
    enabled: !!userId && !!courseId && heldCountOverride === undefined,
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_under_threat', {
        p_user_id: userId,
        p_course_id: courseId,
        p_limit: 200,
      });
      if (error) throw error;
      return (data ?? []) as UnderThreatRow[];
    },
  });


  const { data: reach } = useQuery({
    queryKey: ['course-legends', 'nearest-miss', userId ?? 'anon', courseId],
    enabled: !!userId && !!courseId,
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_player_titles_in_reach', {
        p_user_id: userId,
        p_window: 'all_time',
        p_limit: 50,
      });
      if (error) throw error;
      return (data ?? []) as TitleInReachRow[];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ['course-legends', 'crown-activity', courseId],
    enabled: !!courseId,
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_course_crown_activity', {
        p_course_id: courseId,
      });
      if (error) throw error;
      return ((data ?? []) as CrownActivityRow[])[0] ?? null;
    },
  });

  const crownCount = heldCountOverride ?? crowns?.length ?? 0;

  const nearestMiss = useMemo(() => {
    if (!reach) return null;
    const here = reach.filter((r) => r.course_id === courseId && r.gap != null && r.gap > 0);
    if (here.length === 0) return null;
    here.sort((a, b) => a.gap - b.gap);
    const best = here[0];
    return formatNearestMiss(best.category, best.gap);
  }, [reach, courseId]);

  const changes = activity?.changes_30d ?? 0;

  if (!userId) return null;

  const isLight = theme === 'light';
  const bg = isLight ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.02)';


  return (
    <div
      style={{
        margin: '0 16px 4px',
        padding: '10px 14px 10px',
        background: bg,
        border: `0.5px solid ${HAIRLINE}`,
        borderRadius: 14,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: MUTE,
          marginBottom: 8,
        }}
      >
        You at this club
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        <Cell
          icon="👑"
          value={String(crownCount)}
          label={crownCount === 1 ? 'crown here' : 'crowns here'}
          emphasize={crownCount > 0}
        />
        {nearestMiss ? (
          <>
            <Divider />
            <Cell
              icon="🎯"
              value={nearestMiss.split(' from')[0]}
              label={`from a crown`}
              emphasize
              wide
            />
          </>
        ) : null}
        <Divider />
        <Cell
          icon={changes > 0 ? '📈' : '·'}
          value={changes > 0 ? String(changes) : '—'}
          label={movementLabel}
          emphasize={changes > 0}
          wide
        />
      </div>
    </div>
  );

  function Divider() {
    return (
      <div
        aria-hidden
        style={{
          width: 1,
          margin: '4px 2px',
          background: HAIRLINE,
          flexShrink: 0,
        }}
      />
    );
  }

  function Cell({
    icon,
    value,
    label,
    emphasize,
    wide,
  }: {
    icon?: string;
    value: string;
    label: string;
    emphasize?: boolean;
    wide?: boolean;
  }) {
    return (
      <div
        style={{
          flex: wide ? 1.4 : 1,
          minWidth: 0,
          padding: '2px 6px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          opacity: emphasize ? 1 : 0.65,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0, maxWidth: '100%' }}>
          {icon ? (
            <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>{icon}</span>
          ) : null}
          <span
            className="tabular-nums"
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {value}
          </span>
        </div>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: emphasize ? AMBER : MUTE,
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {label}
        </div>
      </div>
    );
  }
};

export default YouAtThisClubStrip;
