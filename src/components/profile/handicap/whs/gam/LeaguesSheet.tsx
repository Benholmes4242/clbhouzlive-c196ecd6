import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { GAM, BRACKET_EMOJI } from './tokens';
import type { MyLeagueRow } from './LeaguesCard';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  myRow: MyLeagueRow & { promoteCut: number | null; relegateCut: number | null; podSize: number };
}

interface PodMember {
  user_id: string;
  live_rank: number;
  current_points: number;
  rounds_counted: number;
  full_name: string | null;
  avatar_url: string | null;
}

function usePodMembers(podId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['gam', 'pod', podId],
    enabled: enabled && !!podId,
    staleTime: 30_000,
    queryFn: async (): Promise<PodMember[]> => {
      const { data, error } = await supabase
        .from('gam_league_standings_mv')
        .select('user_id, live_rank, current_points, rounds_counted, profile_photo_url')
        .eq('pod_id', podId)
        .order('live_rank', { ascending: true });
      if (error || !data) return [];

      const userIds = data.map((r: any) => r.user_id).filter(Boolean);
      const profilesRes = userIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name, profile_photo_url')
            .in('user_id', userIds)
        : { data: [] as any[] };
      const byId = new Map<string, any>();
      (profilesRes.data ?? []).forEach((p: any) => byId.set(p.user_id, p));

      return data.map((r: any) => ({
        user_id: r.user_id,
        live_rank: r.live_rank ?? 0,
        current_points: r.current_points ?? 0,
        rounds_counted: r.rounds_counted ?? 0,
        full_name: byId.get(r.user_id)?.full_name ?? null,
        avatar_url: byId.get(r.user_id)?.profile_photo_url ?? r.profile_photo_url ?? null,
      }));
    },
  });
}

const RankRow: React.FC<{ m: PodMember; isMe: boolean }> = ({ m, isMe }) => {
  const promote = m.live_rank <= 7;
  const relegate = m.live_rank >= 26;
  const rail = promote ? GAM.GREEN : relegate ? GAM.RED : 'transparent';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        borderBottom: `0.5px solid ${GAM.INK_10}`,
        background: isMe ? GAM.AMBER_06 : 'transparent',
        position: 'relative',
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: rail,
        }}
      />
      <div style={{ width: 26, fontSize: 13, fontWeight: 700, color: GAM.INK, textAlign: 'right', ...GAM.TABULAR }}>
        {m.live_rank}
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          background: GAM.INK_06,
          overflow: 'hidden',
          flexShrink: 0,
          backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 600, color: GAM.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {m.full_name ?? 'Player'}
        </div>
        <div style={{ fontSize: 11, color: GAM.INK_55, marginTop: 1, ...GAM.TABULAR }}>
          {m.rounds_counted} rounds counted
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK, ...GAM.TABULAR }}>
        {m.current_points}
      </div>
    </div>
  );
};

const LeaguesSheet: React.FC<Props> = ({ open, onOpenChange, userId, myRow }) => {
  const { data: members, isLoading, error } = usePodMembers(myRow.pod_id, open);

  const emoji = BRACKET_EMOJI[myRow.bracket.toLowerCase()] ?? '🏆';
  const bracketLabel = myRow.bracket.charAt(0).toUpperCase() + myRow.bracket.slice(1);
  const ptsToPromote = myRow.promoteCut != null
    ? Math.max(0, myRow.promoteCut + 1 - myRow.current_points)
    : 0;
  const bufferDown = myRow.relegateCut != null
    ? Math.max(0, myRow.current_points - myRow.relegateCut)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 max-h-[92dvh] rounded-t-2xl"
        style={{ background: '#FFFFFF', color: GAM.INK, fontFamily: GAM.FONT_GEIST }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: GAM.INK_10 }} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 10px',
            borderBottom: `0.5px solid ${GAM.INK_10}`,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: GAM.INK }}>
            {bracketLabel} Pod{myRow.pod_number != null ? ` ${myRow.pod_number}` : ''}
          </div>
          <button type="button" aria-label="Close" onClick={() => onOpenChange(false)} style={{ background: 'transparent', padding: 4 }}>
            <X size={20} color={GAM.INK_70} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 32, willChange: 'transform' }}>
          {/* Hero */}
          <div style={{ padding: '20px 20px 16px', borderBottom: `0.5px solid ${GAM.INK_10}`, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }} aria-hidden>{emoji}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: GAM.INK, ...GAM.TABULAR }}>#{myRow.live_rank}</span>
              <span style={{ fontSize: 14, color: GAM.INK_55 }}>of {myRow.podSize}</span>
            </div>
            <div style={{ marginTop: 12, padding: '0 12px' }}>
              <div style={{ height: 10, borderRadius: 10, overflow: 'hidden', display: 'flex', background: GAM.INK_06, position: 'relative' }}>
                <div style={{ width: '23.3%', background: GAM.GREEN }} />
                <div style={{ width: '60%', background: GAM.INK_10 }} />
                <div style={{ width: '16.7%', background: GAM.RED }} />
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -3,
                    left: `calc(${((myRow.live_rank - 0.5) / myRow.podSize) * 100}% - 8px)`,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: GAM.AMBER,
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, padding: '0 4px' }}>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: GAM.GREEN_14, color: GAM.GREEN, fontSize: 12, fontWeight: 700, ...GAM.TABULAR }}>
                ↑ {ptsToPromote} pts to promote
              </div>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: GAM.INK_06, color: GAM.INK_70, fontSize: 12, fontWeight: 700, ...GAM.TABULAR }}>
                +{bufferDown} pts buffer down
              </div>
            </div>
          </div>

          {/* Standings list */}
          {isLoading && (
            <div style={{ padding: '12px 20px' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} style={{ height: 44, background: GAM.INK_06, borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          )}
          {error && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: GAM.INK_70 }}>
              Couldn't load pod standings
            </div>
          )}
          {!isLoading && !error && (members ?? []).map(m => (
            <RankRow key={m.user_id} m={m} isMe={m.user_id === userId} />
          ))}

          {/* How it works */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: GAM.INK_55, textTransform: 'uppercase' }}>
              How it works
            </div>
            <div style={{ fontSize: 13, color: GAM.INK_70, lineHeight: 1.5, marginTop: 8 }}>
              <p style={{ margin: '0 0 8px' }}>Pods of 30 bucketed by handicap.</p>
              <p style={{ margin: '0 0 8px' }}>Points come from your best 8 stableford scores this season — the same counters that drive your WHS index.</p>
              <p style={{ margin: '0 0 8px' }}>Top 7 promote · Bottom 5 relegate · Middle 18 stay.</p>
              <p style={{ margin: 0 }}>New pods every quarter.</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeaguesSheet;
