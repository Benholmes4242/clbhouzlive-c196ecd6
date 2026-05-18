/**
 * RivalryPage — head-to-head deep-view page (Brief 4 / File 09).
 *
 * Routes:
 *   /handicap/rivalry/:rivalUserId                      → owner-view ("you vs X")
 *   /handicap/:friendUserId/rivalry/:rivalUserId        → friend-view ("Friend vs Rival")
 *
 * The :rivalUserId param accepts either a real user UUID (Clbhouz friend)
 * or a whs_friend_matches.friend_row_id (non-Clbhouz friend, owner-view only).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useFriendRivalries } from '@/lib/whs/hooks';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import { PageRoot } from '@/components/layout/PageRoot';
import {
  useRivalryDimension,
  type RivalryDimension,
} from '@/lib/whs/utils/useRivalryDimension';

// ── Dark-mode handicap tokens (per project memory + brief) ──────────────
const BG_0 = 'var(--hcp-bg-0)';
const BG_1 = 'var(--hcp-bg-1)';
const BG_2 = 'var(--hcp-bg-2)';
const T100 = 'var(--hcp-t-100)';
const T80 = 'var(--hcp-t-80)';
const T60 = 'var(--hcp-t-60)';
const T40 = 'var(--hcp-t-40)';
const LINE = 'var(--hcp-line)';
const LINE_2 = 'var(--hcp-line-2)';
const AMBER = 'var(--hcp-amber)';
const GREEN = '#16C784';
const RED = '#E5484D';
const GREY = '#475569';

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const TAB: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"kern" 1, "liga" 1',
};

const firstName = (n: string | null | undefined) =>
  (n ?? '').trim().split(/\s+/)[0] || 'Player';

export type RivalryDimension = 'stableford' | 'gross';
const DIMENSION_STORAGE_KEY = 'hcp-rivalry-dimension';

function outcomeFor(
  r: { stableford_outcome: 'W' | 'L' | 'T'; gross_outcome: 'W' | 'L' | 'T' },
  dim: RivalryDimension,
): 'W' | 'L' | 'T' {
  return dim === 'gross' ? r.gross_outcome : r.stableford_outcome;
}

function recordFor(row: FriendRivalryHydrated, dim: RivalryDimension) {
  return (
    (dim === 'gross' ? row.gross_record : row.stableford_record) ?? {
      wins: 0,
      losses: 0,
      ties: 0,
    }
  );
}

// ── Data: owner-view (reuse existing hook + pick row) ───────────────────
function useOwnerRivalry(
  viewerId: string | undefined,
  rivalParamId: string | undefined,
): { row: FriendRivalryHydrated | null; isLoading: boolean; error: unknown } {
  const { data, isLoading, error } = useFriendRivalries(viewerId);
  const row = useMemo(() => {
    if (!data || !rivalParamId) return null;
    return (
      data.find(
        (r) =>
          r.rival_user_id === rivalParamId ||
          r.rival_friend_row_id === rivalParamId,
      ) ?? null
    );
  }, [data, rivalParamId]);
  return { row, isLoading, error };
}

// ── Data: friend-view (new SECURITY DEFINER RPC + client-side hydrate) ──
function useFriendViewRivalry(
  viewerId: string | undefined,
  friendId: string | undefined,
  rivalId: string | undefined,
) {
  return useQuery({
    queryKey: ['rivalry', 'friend-view', viewerId, friendId, rivalId],
    enabled: !!viewerId && !!friendId && !!rivalId,
    staleTime: 30_000,
    queryFn: async (): Promise<FriendRivalryHydrated | null> => {
      const { data: rpcRows, error } = await (supabase as any).rpc(
        'get_friend_view_rivalry',
        {
          p_viewer_id: viewerId,
          p_friend_id: friendId,
          p_rival_id: rivalId,
        },
      );
      if (error) {
        // Privacy denial returns empty set, not error — re-throw only true errors
        // eslint-disable-next-line no-console
        console.warn('[rivalry] friend-view RPC error', error);
        return null;
      }
      const raw = (rpcRows as any[])?.[0];
      if (!raw) return null;

      // Hydrate display names + thumbnails for both sides (Clbhouz users only)
      const ids = [friendId!, rivalId!];
      const { data: profiles } = await (supabase as any)
        .from('user_profiles')
        .select('user_id, full_name, profile_photo_url')
        .in('user_id', ids);
      const byId = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => byId.set(p.user_id, p));

      return {
        ...raw,
        rival_name: byId.get(rivalId!)?.full_name ?? null,
        rival_thumbnail_url: byId.get(rivalId!)?.profile_photo_url ?? null,
        rival_is_clbhouz_user: true,
        rival_friend_connection_id: null,
      } as FriendRivalryHydrated;
    },
  });
}

function useViewerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile-mini', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('user_profiles')
        .select('user_id, full_name, profile_photo_url')
        .eq('user_id', userId)
        .maybeSingle();
      return data as { full_name: string | null; profile_photo_url: string | null } | null;
    },
  });
}

// ── Small visual atoms ─────────────────────────────────────────────────
const Avatar: React.FC<{ url: string | null; size?: number }> = ({
  url,
  size = 64,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '34%',
      background: url ? `url(${url}) center/cover` : BG_2,
      border: `1px solid ${LINE_2}`,
      flexShrink: 0,
    }}
    aria-hidden
  />
);

const Dot: React.FC<{ tone: 'win' | 'loss' | 'tie' | 'empty' }> = ({ tone }) => {
  const color =
    tone === 'win' ? GREEN : tone === 'loss' ? RED : tone === 'tie' ? GREY : T40;
  return (
    <span
      aria-hidden
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: tone === 'empty' ? 'transparent' : color,
        border: tone === 'empty' ? `1px dashed ${T40}` : 'none',
        display: 'inline-block',
      }}
    />
  );
};

// ── Section: hero card ─────────────────────────────────────────────────
interface HeroProps {
  row: FriendRivalryHydrated;
  ownerView: boolean;
  ownerName: string | null;
  ownerThumb: string | null;
  ownerHcp: number | null;
  dimension: RivalryDimension;
  onDimensionChange: (d: RivalryDimension) => void;
}

const RivalryHero: React.FC<HeroProps> = ({
  row,
  ownerView,
  ownerName,
  ownerThumb,
  ownerHcp,
  dimension,
  onDimensionChange,
}) => {
  const rec = recordFor(row, dimension);
  const wins = rec.wins ?? 0;
  const losses = rec.losses ?? 0;
  const ties = rec.ties ?? 0;
  const total = wins + losses + ties;

  const results = (row.shared_round_results ?? [])
    .slice()
    .sort((a, b) => b.play_date.localeCompare(a.play_date));

  // Last 3 dots (own perspective — owner-side W/L/T) per selected dimension
  const last3 = results.slice(0, 3);
  // Current streak
  let streakWho: 'owner' | 'rival' | null = null;
  let streakCount = 0;
  for (const r of results) {
    const o = outcomeFor(r, dimension);
    const who: 'owner' | 'rival' | 'tie' =
      o === 'W' ? 'owner' : o === 'L' ? 'rival' : 'tie';
    if (who === 'tie') break;
    if (streakWho === null) {
      streakWho = who;
      streakCount = 1;
    } else if (who === streakWho) {
      streakCount += 1;
    } else {
      break;
    }
  }

  const leadingSide: 'a' | 'b' | 'tie' =
    wins > losses ? 'a' : losses > wins ? 'b' : 'tie';
  const trophyA = leadingSide === 'a';
  const trophyB = leadingSide === 'b';
  const handshake = leadingSide === 'tie' && total > 0;

  const leftName = ownerView ? 'You' : firstName(ownerName);
  const rightName = firstName(row.rival_name);
  const streakName = streakWho === 'owner' ? leftName : rightName;

  return (
    <div
      style={{
        margin: '16px',
        padding: 20,
        background: BG_1,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
      }}
    >
      {/* Dimension toggle */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <DimensionToggle value={dimension} onChange={onDimensionChange} />
      </div>

      {/* Big record */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 12,
          color: T100,
          fontWeight: 800,
          fontSize: 56,
          lineHeight: 1,
          ...TAB,
        }}
      >
        {trophyA && <span aria-hidden style={{ fontSize: 28 }}>🏆</span>}
        <span>{wins}</span>
        <span style={{ color: T40, fontWeight: 700, fontSize: 40 }}>—</span>
        <span>{losses}</span>
        {trophyB && <span aria-hidden style={{ fontSize: 28 }}>🏆</span>}
        {handshake && <span aria-hidden style={{ fontSize: 28 }}>🤝</span>}
      </div>
      {total > 0 && (
        <div
          style={{
            marginTop: 8,
            textAlign: 'center',
            color: T60,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          {ties > 0
            ? `with ${ties} tie${ties === 1 ? '' : 's'} in ${total} total`
            : `${total} round${total === 1 ? '' : 's'} total`}
        </div>
      )}
      {total === 0 && (
        <div style={{ marginTop: 8, textAlign: 'center', color: T60, fontSize: 12 }}>
          No matches yet
        </div>
      )}

      {/* Head-to-head avatars */}
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <Stack name={leftName} hcp={ownerHcp} url={ownerThumb} />
        <span
          style={{
            color: T40,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          vs
        </span>
        <Stack
          name={rightName}
          hcp={row.rival_handicap}
          url={row.rival_thumbnail_url}
        />
      </div>

      {/* Momentum */}
      {total > 0 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                color: T60,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Last 3
            </span>
            <span style={{ display: 'inline-flex', gap: 6 }}>
              {[0, 1, 2].map((i) => {
                const r = last3[i];
                if (!r) return <Dot key={i} tone="empty" />;
                const o = outcomeFor(r, dimension);
                const tone = o === 'W' ? 'win' : o === 'L' ? 'loss' : 'tie';
                return <Dot key={i} tone={tone} />;
              })}
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              textAlign: 'center',
              color: T100,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {streakCount >= 2
              ? `Current streak: ${streakName}, ${streakCount} round${streakCount === 1 ? '' : 's'}`
              : 'No active streak'}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Dimension toggle (Stableford ↔ Gross) ──────────────────────────────
const DimensionToggle: React.FC<{
  value: RivalryDimension;
  onChange: (d: RivalryDimension) => void;
}> = ({ value, onChange }) => {
  const opts: { id: RivalryDimension; label: string }[] = [
    { id: 'stableford', label: 'Stableford' },
    { id: 'gross', label: 'Gross' },
  ];
  return (
    <div
      role="tablist"
      aria-label="Scoring dimension"
      style={{
        display: 'inline-flex',
        margin: '0 auto 16px',
        padding: 3,
        background: BG_2,
        border: `1px solid ${LINE}`,
        borderRadius: 999,
        gap: 2,
        // center the inline-flex inside the flex column hero
        alignSelf: 'center',
      }}
    >
      {opts.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: active ? AMBER : 'transparent',
              color: active ? '#0F172A' : T60,
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

const Stack: React.FC<{ name: string; hcp: number | null; url: string | null }> = ({
  name,
  hcp,
  url,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    <Avatar url={url} size={64} />
    <div style={{ color: T100, fontWeight: 700, fontSize: 14 }}>{name}</div>
    {hcp != null && (
      <div style={{ color: T60, fontWeight: 600, fontSize: 13, ...TAB }}>
        {hcp.toFixed(1)}
      </div>
    )}
  </div>
);

// ── Section: courses played together (in-memory groupBy) ───────────────
interface CourseAgg {
  course_id: string;
  course_name: string;
  rounds: number;
  ownerWins: number;
  rivalWins: number;
  ties: number;
  lastPlayed: string;
}

function aggregateCourses(
  row: FriendRivalryHydrated,
  dimension: RivalryDimension,
): CourseAgg[] {
  const map = new Map<string, CourseAgg>();
  for (const r of row.shared_round_results ?? []) {
    let agg = map.get(r.course_id);
    if (!agg) {
      agg = {
        course_id: r.course_id,
        course_name: r.course_name,
        rounds: 0,
        ownerWins: 0,
        rivalWins: 0,
        ties: 0,
        lastPlayed: r.play_date,
      };
      map.set(r.course_id, agg);
    }
    agg.rounds += 1;
    const o = outcomeFor(r, dimension);
    if (o === 'W') agg.ownerWins += 1;
    else if (o === 'L') agg.rivalWins += 1;
    else agg.ties += 1;
    if (r.play_date > agg.lastPlayed) agg.lastPlayed = r.play_date;
  }
  return Array.from(map.values()).sort(
    (a, b) => b.rounds - a.rounds || b.lastPlayed.localeCompare(a.lastPlayed),
  );
}

interface CoursesProps {
  courses: CourseAgg[];
  onCoursePick: (courseId: string) => void;
}

const CoursesPlayedSection: React.FC<CoursesProps> = ({ courses, onCoursePick }) => {
  if (courses.length === 0) return null;
  return (
    <section style={{ padding: '24px 16px 8px' }}>
      <SectionHeader label="Courses played together" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        {courses.map((c) => (
          <button
            key={c.course_id}
            type="button"
            onClick={() => onCoursePick(c.course_id)}
            style={{
              textAlign: 'left',
              padding: 14,
              background: BG_1,
              border: `1px solid ${LINE}`,
              borderRadius: 12,
              cursor: 'pointer',
              color: T100,
              fontFamily: FONT,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {c.course_name}
            </div>
            <div
              style={{
                marginTop: 6,
                color: T60,
                fontSize: 12,
                fontWeight: 500,
                ...TAB,
              }}
            >
              {c.rounds} round{c.rounds === 1 ? '' : 's'} · {c.ownerWins}-{c.rivalWins}
              {c.ties > 0 ? ` (${c.ties}T)` : ''}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

// ── Section: round-by-round ────────────────────────────────────────────
interface RoundsProps {
  row: FriendRivalryHydrated;
  ownerView: boolean;
  ownerName: string | null;
  courseFilter: string | null;
  setCourseFilter: (id: string | null) => void;
  scrollAnchor: React.RefObject<HTMLDivElement>;
  dimension: RivalryDimension;
}

const INITIAL_LIMIT = 20;

const RoundByRoundSection: React.FC<RoundsProps> = ({
  row,
  ownerView,
  ownerName,
  courseFilter,
  setCourseFilter,
  scrollAnchor,
  dimension,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sorted = useMemo(
    () =>
      (row.shared_round_results ?? [])
        .slice()
        .sort((a, b) => b.play_date.localeCompare(a.play_date)),
    [row.shared_round_results],
  );

  const filtered = useMemo(
    () => (courseFilter ? sorted.filter((r) => r.course_id === courseFilter) : sorted),
    [sorted, courseFilter],
  );

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const filterCourseName = courseFilter
    ? sorted.find((r) => r.course_id === courseFilter)?.course_name ?? null
    : null;

  // Course options for dropdown
  const courseOpts = useMemo(() => {
    const m = new Map<string, string>();
    sorted.forEach((r) => m.set(r.course_id, r.course_name));
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [sorted]);

  const leftLabel = ownerView ? 'You' : firstName(ownerName);
  const rightLabel = firstName(row.rival_name);

  return (
    <section ref={scrollAnchor} style={{ padding: '24px 16px 32px' }}>
      <SectionHeader label="Round-by-round history" />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Chip
          active={courseFilter === null}
          onClick={() => {
            setCourseFilter(null);
            setDropdownOpen(false);
          }}
        >
          All {sorted.length}
        </Chip>
        <div style={{ position: 'relative' }}>
          <Chip
            active={courseFilter !== null}
            onClick={() => setDropdownOpen((o) => !o)}
          >
            {filterCourseName ?? 'By course'}
            {courseFilter !== null && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCourseFilter(null);
                }}
                aria-label="Clear filter"
                style={{
                  marginLeft: 6,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} strokeWidth={2.4} />
              </button>
            )}
          </Chip>
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 20,
                background: BG_2,
                border: `1px solid ${LINE_2}`,
                borderRadius: 10,
                padding: 6,
                minWidth: 200,
                maxHeight: 280,
                overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {courseOpts.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCourseFilter(opt.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    background:
                      courseFilter === opt.id ? 'rgba(247,147,30,0.12)' : 'transparent',
                    border: 'none',
                    color: T100,
                    fontSize: 13,
                    fontFamily: FONT,
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <div style={{ padding: '32px 8px', color: T60, fontSize: 13, textAlign: 'center' }}>
          No shared rounds yet
        </div>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map((r, i) => {
            const o = outcomeFor(r, dimension);
            const dot = o === 'W' ? GREEN : o === 'L' ? RED : GREY;
            const margin = Math.abs(r.user_gross - r.rival_gross);
            let verdict: string;
            if (o === 'W') {
              verdict = `Win for ${leftLabel.toLowerCase() === 'you' ? 'you' : leftLabel} · ${margin} stroke${margin === 1 ? '' : 's'}`;
            } else if (o === 'L') {
              verdict = `Win for ${rightLabel} · ${margin} stroke${margin === 1 ? '' : 's'}`;
            } else {
              verdict = `Tied · ${margin === 0 ? 'level' : `${margin} stroke${margin === 1 ? '' : 's'} each`}`;
            }
            const dateLabel = formatShortDate(r.play_date);
            return (
              <div
                key={`${r.play_date}-${r.course_id}-${i}`}
                style={{
                  padding: '12px 14px',
                  background: BG_1,
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  fontFamily: FONT,
                }}
              >
                <div
                  style={{
                    color: T60,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {dateLabel} · {r.course_name}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: T100,
                    fontSize: 15,
                    ...TAB,
                  }}
                >
                  <span>
                    {leftLabel} {r.user_gross}{' '}
                    <span style={{ color: T60, fontWeight: 500 }}>
                      ({r.user_stableford} pts)
                    </span>
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: dot,
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    {rightLabel} {r.rival_gross}{' '}
                    <span style={{ color: T60, fontWeight: 500 }}>
                      ({r.rival_stableford} pts)
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 6,
                    color: T80,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {verdict}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!showAll && filtered.length > INITIAL_LIMIT && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{
            marginTop: 16,
            width: '100%',
            padding: 12,
            background: 'transparent',
            border: `1px solid ${LINE_2}`,
            borderRadius: 10,
            color: T100,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          Show all {filtered.length} rounds
        </button>
      )}
    </section>
  );
};

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      color: T60,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      borderTop: `0.5px solid ${LINE_2}`,
      paddingTop: 12,
      fontFamily: FONT,
    }}
  >
    {label}
  </div>
);

const Chip: React.FC<React.PropsWithChildren<{ active: boolean; onClick: () => void }>> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '6px 12px',
      background: active ? 'rgba(247,147,30,0.14)' : 'transparent',
      border: `1px solid ${active ? AMBER : LINE_2}`,
      borderRadius: 999,
      color: active ? AMBER : T80,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.04em',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: FONT,
    }}
  >
    {children}
  </button>
);

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Privacy blocked state ──────────────────────────────────────────────
const PrivacyBlockedView: React.FC = () => (
  <div
    style={{
      padding: '64px 24px',
      textAlign: 'center',
      fontFamily: FONT,
      color: T100,
    }}
  >
    <div style={{ fontSize: 16, fontWeight: 700 }}>Rivalry not visible</div>
    <div style={{ fontSize: 13, color: T60, marginTop: 8, maxWidth: 320, margin: '8px auto 0' }}>
      This rivalry is between two users you're not connected to.
    </div>
    <Link
      to="/handicap"
      style={{
        display: 'inline-block',
        marginTop: 24,
        padding: '10px 18px',
        background: AMBER,
        color: '#0F172A',
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 13,
        textDecoration: 'none',
      }}
    >
      Back to handicap
    </Link>
  </div>
);

// ── Sticky header ──────────────────────────────────────────────────────
interface HeaderProps {
  scrolled: boolean;
  subtitle: string | null;
  onBack: () => void;
}
const RivalryHeader: React.FC<HeaderProps> = ({ scrolled, subtitle, onBack }) => (
  <div
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: BG_0,
      borderBottom: scrolled ? `0.5px solid ${LINE_2}` : '0.5px solid transparent',
      transition: 'border-color 200ms ease',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
    }}
  >
    <div
      style={{
        padding: '8px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 8,
          marginLeft: -8,
          color: T100,
          cursor: 'pointer',
        }}
      >
        <ChevronLeft size={22} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: AMBER,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: FONT,
          }}
        >
          Rivalry
        </div>
        <div
          style={{
            color: T100,
            fontSize: scrolled ? 14 : 22,
            fontWeight: 700,
            lineHeight: 1.2,
            fontFamily: FONT,
            transition: 'font-size 200ms ease, opacity 200ms ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {scrolled && subtitle ? `Rivalry · ${subtitle}` : 'Rivalry'}
        </div>
      </div>
      <button
        type="button"
        aria-label="More"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 8,
          marginRight: -8,
          color: T60,
          cursor: 'pointer',
        }}
      >
        <MoreHorizontal size={20} />
      </button>
    </div>
  </div>
);

// ── Page root ──────────────────────────────────────────────────────────
const RivalryPage: React.FC = () => {
  const params = useParams<{ rivalUserId?: string; friendUserId?: string; rivalId?: string }>();
  // Support both legacy /handicap/rivalry/:rivalId and new /handicap/rivalry/:rivalUserId
  const rivalParam = params.rivalUserId ?? params.rivalId ?? undefined;
  const friendParam = params.friendUserId ?? undefined;
  const isFriendView = !!friendParam;

  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const viewerId = user?.id;

  // Owner-view: viewer pulls own rivalries
  const owner = useOwnerRivalry(!isFriendView ? viewerId : undefined, rivalParam);
  // Friend-view: RPC with transitive trust
  const friend = useFriendViewRivalry(
    isFriendView ? viewerId : undefined,
    isFriendView ? friendParam : undefined,
    isFriendView ? rivalParam : undefined,
  );

  // Viewer profile for owner-view stack
  const { data: viewerProfile } = useViewerProfile(!isFriendView ? viewerId : undefined);
  // Friend (rivalry owner) profile for friend-view stack
  const { data: friendProfile } = useViewerProfile(isFriendView ? friendParam : undefined);

  const row = isFriendView ? (friend.data ?? null) : owner.row;
  const isLoading = isFriendView ? friend.isLoading : owner.isLoading;
  const errored = isFriendView ? !!friend.error : !!owner.error;

  // Sticky-header collapse on scroll past hero
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 220);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Course-filter shared state (so course-card tap can pre-filter timeline)
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const handleCoursePick = (id: string) => {
    setCourseFilter(id);
    requestAnimationFrame(() => {
      timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Scoring dimension (Stableford default), persisted in localStorage
  const [dimension, setDimension] = useState<RivalryDimension>(() => {
    if (typeof window === 'undefined') return 'stableford';
    const v = window.localStorage.getItem(DIMENSION_STORAGE_KEY);
    return v === 'gross' ? 'gross' : 'stableford';
  });
  const handleDimensionChange = (d: RivalryDimension) => {
    setDimension(d);
    try {
      window.localStorage.setItem(DIMENSION_STORAGE_KEY, d);
    } catch {
      /* noop */
    }
  };

  // Owner-view: hydrate "ownerName/ownerThumb/ownerHcp" from viewer profile
  const ownerName = isFriendView
    ? friendProfile?.full_name ?? null
    : viewerProfile?.full_name ?? null;
  const ownerThumb = isFriendView
    ? friendProfile?.profile_photo_url ?? null
    : viewerProfile?.profile_photo_url ?? null;
  // ownerHcp not currently available without an extra fetch — leave null for v1
  const ownerHcp = null;

  const headerSubtitle = row
    ? `${isFriendView ? firstName(ownerName) : 'You'} vs ${firstName(row.rival_name)}`
    : null;

  return (
    <PageRoot
      className="hcp-dark"
      style={{
        background: BG_0,
        minHeight: '100vh',
        fontFamily: FONT,
        color: T100,
      }}
    >
      <RivalryHeader
        scrolled={scrolled}
        subtitle={headerSubtitle}
        onBack={() => navigate(-1)}
      />

      {!viewerId && (
        <div style={{ padding: 48, textAlign: 'center', color: T60 }}>Sign in to view rivalry</div>
      )}

      {viewerId && isLoading && <RivalrySkeleton />}

      {viewerId && !isLoading && (errored || (!row && !isFriendView)) && (
        <div
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            fontFamily: FONT,
          }}
        >
          <div style={{ color: T100, fontSize: 16, fontWeight: 700 }}>Rivalry not found</div>
          <div style={{ color: T60, fontSize: 13, marginTop: 8 }}>
            This rivalry may no longer exist.
          </div>
        </div>
      )}

      {viewerId && !isLoading && isFriendView && !row && !errored && <PrivacyBlockedView />}

      {viewerId && !isLoading && row && (
        <>
          <RivalryHero
            row={row}
            ownerView={!isFriendView}
            ownerName={ownerName}
            ownerThumb={ownerThumb}
            ownerHcp={ownerHcp}
            dimension={dimension}
            onDimensionChange={handleDimensionChange}
          />
          <CoursesPlayedSection
            courses={aggregateCourses(row, dimension)}
            onCoursePick={handleCoursePick}
          />
          <RoundByRoundSection
            row={row}
            ownerView={!isFriendView}
            ownerName={ownerName}
            courseFilter={courseFilter}
            setCourseFilter={setCourseFilter}
            scrollAnchor={timelineRef}
            dimension={dimension}
          />
        </>
      )}
    </PageRoot>
  );
};

const RivalrySkeleton: React.FC = () => (
  <div style={{ padding: 16 }}>
    <div
      className="animate-pulse"
      style={{ height: 240, background: BG_1, borderRadius: 12, marginBottom: 16 }}
    />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: 68, background: BG_1, borderRadius: 12 }}
        />
      ))}
    </div>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="animate-pulse"
        style={{ height: 82, background: BG_1, borderRadius: 12, marginBottom: 8 }}
      />
    ))}
  </div>
);

export default RivalryPage;
