import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { PageRoot } from '@/components/layout/PageRoot';
import { GAM } from './tokens';

interface SharedRound {
  play_date: string;
  course_id: string;
  course_name: string;
  user_stableford: number;
  rival_stableford: number;
  user_gross: number;
  rival_gross: number;
  stableford_outcome: 'W' | 'L' | 'T';
  gross_outcome: 'W' | 'L' | 'T';
}

interface RivalryRow {
  user_id: string;
  slot_index: number;
  rival_user_id: string | null;
  rival_handicap: number | null;
  stableford_record: { wins: number; losses: number; ties: number };
  shared_round_results: SharedRound[];
  rival_name: string | null;
  rival_thumbnail_url: string | null;
  user_name: string | null;
  user_thumbnail_url: string | null;
}

function useRivalry(userId: string | undefined, rivalId: string | undefined) {
  return useQuery({
    queryKey: ['gam', 'rivalry-deep', userId, rivalId],
    enabled: !!userId && !!rivalId,
    staleTime: 30_000,
    queryFn: async (): Promise<RivalryRow | null> => {
      // Find the rivalry row for current user against rivalId (rival_user_id)
      const { data: rows } = await (supabase as any)
        .from('friend_rivalry_hydrated_view')
        .select('*')
        .eq('user_id', userId!)
        .eq('rival_user_id', rivalId!)
        .limit(1);
      let row = rows?.[0];

      // Fallback: query raw friend_rivalry if view doesn't exist
      if (!row) {
        const { data: raw } = await (supabase as any)
          .from('friend_rivalry')
          .select('*')
          .eq('user_id', userId!)
          .eq('rival_user_id', rivalId!)
          .limit(1);
        row = raw?.[0];
      }
      if (!row) return null;

      // Hydrate names/avatars from user_profiles
      const ids = [userId!, rivalId!];
      const { data: profiles } = await (supabase as any)
        .from('user_profiles')
        .select('user_id, full_name, profile_photo_url')
        .in('user_id', ids);
      const byId = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => byId.set(p.user_id, p));

      return {
        ...row,
        user_name: byId.get(userId!)?.full_name ?? null,
        user_thumbnail_url: byId.get(userId!)?.profile_photo_url ?? null,
        rival_name: row.rival_name ?? byId.get(rivalId!)?.full_name ?? null,
        rival_thumbnail_url: row.rival_thumbnail_url ?? byId.get(rivalId!)?.profile_photo_url ?? null,
      } as RivalryRow;
    },
  });
}

const Avatar: React.FC<{ url: string | null; ring: string; size?: number }> = ({ url, ring, size = 64 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '34%',
      background: url ? `url(${url}) center/cover` : GAM.INK_06,
      border: `3px solid ${ring}`,
      flexShrink: 0,
    }}
  />
);

const Pill: React.FC<{ outcome: 'W' | 'L' | 'T' }> = ({ outcome }) => {
  const bg = outcome === 'W' ? GAM.GREEN_14 : outcome === 'L' ? GAM.RED_14 : GAM.INK_06;
  const fg = outcome === 'W' ? GAM.GREEN : outcome === 'L' ? GAM.RED : GAM.INK_70;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        borderRadius: 4,
        background: bg,
        color: fg,
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      {outcome}
    </span>
  );
};

const RivalryDeepView: React.FC = () => {
  const { rivalId } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const { data, isLoading, error } = useRivalry(userId, rivalId);

  if (!userId) return null;

  return (
    <PageRoot style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: GAM.FONT_GEIST, color: GAM.INK }}>
      <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}>
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', padding: 8, marginLeft: -8 }}
          >
            <ChevronLeft size={22} color={GAM.INK} />
          </button>
        </div>

        {isLoading && (
          <div style={{ padding: 24 }}>
            <div style={{ height: 64, background: GAM.INK_06, borderRadius: 8, marginBottom: 16 }} />
            <div style={{ height: 120, background: GAM.INK_06, borderRadius: 12, marginBottom: 16 }} />
            <div style={{ height: 60, background: GAM.INK_06, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ height: 60, background: GAM.INK_06, borderRadius: 8 }} />
          </div>
        )}

        {(!isLoading && (error || !data)) && (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: GAM.INK }}>Rivalry not found</div>
            <div style={{ fontSize: 13, color: GAM.INK_55, marginTop: 8 }}>This rivalry may no longer exist.</div>
          </div>
        )}

        {!isLoading && data && (
          <DeepBody row={data} userId={userId} navigate={navigate} />
        )}
      </div>
    </PageRoot>
  );
};

const DeepBody: React.FC<{ row: RivalryRow; userId: string; navigate: (to: string) => void }> = ({ row, userId, navigate }) => {
  const stab = row.stableford_record || { wins: 0, losses: 0, ties: 0 };
  const wins = stab.wins ?? 0;
  const losses = stab.losses ?? 0;
  const ties = stab.ties ?? 0;
  const total = (row.shared_round_results ?? []).length;
  const youWin = wins > losses;

  // Course breakdown
  const breakdown = new Map<string, { name: string; w: number; l: number; t: number; lastPlayed: string }>();
  (row.shared_round_results ?? []).forEach(r => {
    const cur = breakdown.get(r.course_id) || { name: r.course_name, w: 0, l: 0, t: 0, lastPlayed: r.play_date };
    if (r.stableford_outcome === 'W') cur.w++;
    else if (r.stableford_outcome === 'L') cur.l++;
    else cur.t++;
    if (r.play_date > cur.lastPlayed) cur.lastPlayed = r.play_date;
    breakdown.set(r.course_id, cur);
  });
  const breakdownList = Array.from(breakdown.entries())
    .map(([course_id, v]) => ({ course_id, ...v, played: v.w + v.l + v.t }))
    .sort((a, b) => b.played - a.played || b.lastPlayed.localeCompare(a.lastPlayed));

  const lastMeeting = [...(row.shared_round_results ?? [])].sort((a, b) =>
    b.play_date.localeCompare(a.play_date),
  )[0];

  const recentForm = [...(row.shared_round_results ?? [])]
    .sort((a, b) => b.play_date.localeCompare(a.play_date))
    .slice(0, 7);

  return (
    <div style={{ padding: '0 0 48px' }}>
      <div style={{ padding: '8px 20px 4px', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: GAM.AMBER, textTransform: 'uppercase' }}>
        Rivalry
      </div>

      {/* Avatar duel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <Avatar url={row.user_thumbnail_url} ring={GAM.AMBER} />
          <div style={{ fontSize: 13, fontWeight: 700, color: GAM.INK, marginTop: 6 }}>You</div>
        </div>
        <div style={{ fontSize: 22, color: GAM.INK_55 }} aria-hidden>⚔</div>
        <div style={{ textAlign: 'center' }}>
          <Avatar url={row.rival_thumbnail_url} ring={GAM.INK} />
          <div style={{ fontSize: 13, fontWeight: 700, color: GAM.INK, marginTop: 6, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.rival_name ?? 'Rival'}
          </div>
          {row.rival_handicap != null && (
            <div style={{ fontSize: 11, color: GAM.INK_55, ...GAM.TABULAR }}>hcp {row.rival_handicap.toFixed(1)}</div>
          )}
        </div>
      </div>

      {/* Score hero */}
      <div style={{ margin: '8px 20px', padding: 20, borderRadius: 14, background: GAM.INK_06, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, ...GAM.TABULAR }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: youWin ? GAM.GREEN : GAM.INK }}>{wins}</span>
          <span style={{ fontSize: 28, color: GAM.INK_40, fontWeight: 600 }}>—</span>
          <span style={{ fontSize: 44, fontWeight: 800, color: !youWin && losses > wins ? GAM.RED : GAM.INK }}>{losses}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: youWin ? GAM.GREEN : losses > wins ? GAM.RED : GAM.INK_70, textTransform: 'uppercase' }}>
          {wins === losses ? 'All square' : youWin ? 'You lead' : `${row.rival_name ?? 'They'} lead`}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: GAM.INK_55 }}>
          {ties} tie{ties === 1 ? '' : 's'} · {total} shared round{total === 1 ? '' : 's'}
        </div>
        {recentForm.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 4, justifyContent: 'center' }}>
            {recentForm.map((r, i) => <Pill key={i} outcome={r.stableford_outcome} />)}
          </div>
        )}
      </div>

      {/* Course breakdown */}
      {breakdownList.length > 0 && (
        <>
          <div style={{ padding: '20px 20px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: GAM.INK_55, textTransform: 'uppercase' }}>
            Course breakdown
          </div>
          {breakdownList.map(b => {
            const lead = b.w > b.l ? 'YOU LEAD' : b.l > b.w ? 'THEY LEAD' : 'TIED';
            const leadColor = b.w > b.l ? GAM.GREEN : b.l > b.w ? GAM.RED : GAM.INK_70;
            return (
              <button
                key={b.course_id}
                type="button"
                onClick={() => navigate(`/courses/${b.course_id}`)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  borderBottom: `0.5px solid ${GAM.INK_10}`,
                  background: 'transparent',
                  textAlign: 'left',
                }}
              >
                <MapPin size={16} color={GAM.INK_55} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GAM.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11, color: leadColor, fontWeight: 700, marginTop: 2, letterSpacing: 0.4 }}>
                    {lead}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK, ...GAM.TABULAR }}>
                  {b.w} — {b.l}
                </div>
              </button>
            );
          })}
        </>
      )}

      {/* Last meeting */}
      {lastMeeting && (
        <>
          <div style={{ padding: '20px 20px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: GAM.INK_55, textTransform: 'uppercase' }}>
            Last meeting
          </div>
          <div style={{ margin: '0 20px', padding: 14, borderRadius: 12, background: GAM.INK_06 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GAM.INK }}>{lastMeeting.course_name}</div>
            <div style={{ fontSize: 11, color: GAM.INK_55, marginTop: 2 }}>{lastMeeting.play_date}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: GAM.INK_55, letterSpacing: 0.4, textTransform: 'uppercase' }}>You</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: GAM.INK, ...GAM.TABULAR }}>{lastMeeting.user_stableford}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: GAM.INK_55, letterSpacing: 0.4, textTransform: 'uppercase' }}>{row.rival_name ?? 'Them'}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: GAM.INK, ...GAM.TABULAR }}>{lastMeeting.rival_stableford}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RivalryDeepView;
