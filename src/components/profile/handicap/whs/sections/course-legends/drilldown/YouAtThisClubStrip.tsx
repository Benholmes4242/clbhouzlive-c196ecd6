import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { KICKER } from '@/features/courses/components/holes/analytical/tokens';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = 'var(--hcp-t-100)';
const MUTE = 'var(--hcp-t-60)';
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

/**
 * The nearest-crown figure is ONE board — the smallest gap among the titles
 * this member is in reach of AT THIS COURSE (get_player_titles_in_reach,
 * filtered by course, min gap). It is never an average across categories, so
 * it always carries that board's own unit and the board it belongs to.
 */
const NEAREST_MISS_META: Record<
  string,
  { unit: string; unitSingular: string; board: string; decimals: number }
> = {
  lowest_gross:     { unit: 'strokes', unitSingular: 'stroke', board: 'gross',       decimals: 0 },
  best_score_diff:  { unit: 'strokes', unitSingular: 'stroke', board: 'differential', decimals: 1 },
  most_birdies:     { unit: 'birdies', unitSingular: 'birdie', board: 'birdies',     decimals: 0 },
  best_stableford:  { unit: 'points',  unitSingular: 'point',  board: 'stableford',  decimals: 0 },
  most_eagles:      { unit: 'eagles',  unitSingular: 'eagle',  board: 'eagles',      decimals: 0 },
  most_aces:        { unit: 'aces',    unitSingular: 'ace',    board: 'aces',        decimals: 0 },
  most_albatrosses: { unit: 'albatrosses', unitSingular: 'albatross', board: 'albatrosses', decimals: 0 },
  most_rounds:      { unit: 'rounds',  unitSingular: 'round',  board: 'rounds',      decimals: 0 },
};

function stripWindow(cat: string): string {
  return cat.replace(/_(90d|all_time)$/, '');
}

/** Returns the figure and the DIM label beneath it: unit + the board named. */
function formatNearestMiss(category: string, gap: number): { value: string; label: string } {
  const meta = NEAREST_MISS_META[stripWindow(category)];
  if (!meta) return { value: String(gap), label: 'from a crown' };
  const rounded = Math.max(1, Math.round(gap));
  const v = meta.decimals > 0 ? gap.toFixed(meta.decimals) : String(rounded);
  const isOne = meta.decimals === 0 && rounded === 1;
  const unit = isOne ? meta.unitSingular : meta.unit;
  const label = unit && unit !== meta.board ? `${unit} from ${meta.board}` : `from ${meta.board}`;
  return { value: v, label };
}


interface Props {
  userId: string | undefined;
  courseId: string;
  theme?: 'light' | 'dark';
  /** When provided, overrides the strip's own RPC-derived crown count so it stays in sync with the cabinet's window-scoped fraction. */
  heldCountOverride?: number;
  /** Render without its own card chrome (used inside the combined "you" card). */
  bare?: boolean;
}

export const YouAtThisClubStrip: React.FC<Props> = ({ userId, courseId, theme = 'dark', heldCountOverride, bare = false }) => {


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


  const body = (
    <>
      <div style={{ ...KICKER, marginBottom: 8 }}>
        You at this club
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        <Cell
          value={String(crownCount)}
          label="crowns"
          emphasize={crownCount > 0}
        />
        {nearestMiss ? (
          <>
            <Divider />
            <Cell
              value={nearestMiss.value}
              label={nearestMiss.label}

              emphasize
              wide
            />
          </>
        ) : null}
        <Divider />
        <Cell
          value={String(changes)}
          label="changes 30d"
          emphasize={changes > 0}
          wide
        />
      </div>
    </>
  );

  if (bare) {
    return <div style={{ fontFamily: FONT, minWidth: 0 }}>{body}</div>;
  }

  return (
    <div
      style={{
        margin: '16px 16px 4px',
        padding: '10px 14px 10px',
        background: bg,
        border: `0.5px solid ${HAIRLINE}`,
        borderRadius: 14,
        fontFamily: FONT,
      }}
    >
      {body}
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
    value,
    label,
    emphasize,
    wide,
  }: {
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
          <span
            className="tabular-nums"
            style={{
              fontSize: 15,
              fontWeight: 700,
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
            ...KICKER,
            lineHeight: 1.2,
            maxWidth: '100%',
            textAlign: 'center',
          }}
        >
          {label}
        </div>


      </div>
    );
  }
};

export default YouAtThisClubStrip;
