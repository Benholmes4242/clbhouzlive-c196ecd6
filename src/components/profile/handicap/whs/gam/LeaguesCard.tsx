import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GAM, BRACKET_EMOJI } from './tokens';
import LeaguesSheet from './LeaguesSheet';

interface Props {
  userId: string;
  isOwner: boolean;
}

export interface MyLeagueRow {
  pod_id: string;
  league_id: string;
  bracket: string;
  season: string;
  season_end: string;
  live_rank: number;
  current_points: number;
  rounds_counted: number;
  zone: string;
  pod_number: number | null;
}

interface NeighborPoints {
  /** points of rank 7 (last promotion slot) */
  promoteCut: number | null;
  /** points of rank 26 (first relegation slot) */
  relegateCut: number | null;
  /** total pod size, normally 30 */
  podSize: number;
}

function useMyLeague(userId: string) {
  return useQuery({
    queryKey: ['gam', 'my-league', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<(MyLeagueRow & NeighborPoints) | null> => {
      const mine = await supabase
        .from('gam_league_standings_mv')
        .select('pod_id, league_id, bracket, season, season_end, live_rank, current_points, rounds_counted, zone, pod_number')
        .eq('user_id', userId)
        .maybeSingle();
      if (mine.error || !mine.data || !mine.data.pod_id) return null;

      const pod = await supabase
        .from('gam_league_standings_mv')
        .select('live_rank, current_points')
        .eq('pod_id', mine.data.pod_id)
        .order('live_rank', { ascending: true });

      const rows = (pod.data ?? []) as Array<{ live_rank: number | null; current_points: number | null }>;
      const promoteCut = rows.find(r => r.live_rank === 7)?.current_points ?? null;
      const relegateCut = rows.find(r => r.live_rank === 26)?.current_points ?? null;

      return {
        pod_id: mine.data.pod_id!,
        league_id: mine.data.league_id!,
        bracket: mine.data.bracket ?? '',
        season: mine.data.season ?? '',
        season_end: mine.data.season_end ?? '',
        live_rank: mine.data.live_rank ?? 0,
        current_points: mine.data.current_points ?? 0,
        rounds_counted: mine.data.rounds_counted ?? 0,
        zone: mine.data.zone ?? 'safe',
        pod_number: mine.data.pod_number,
        promoteCut,
        relegateCut,
        podSize: rows.length || 30,
      };
    },
  });
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((+new Date(iso) - Date.now()) / 86400000));
}

const PromoBar: React.FC<{ rank: number; podSize: number; height?: number }> = ({ rank, podSize, height = 6 }) => {
  const dotLeftPct = ((rank - 0.5) / podSize) * 100;
  return (
    <div style={{ position: 'relative', marginTop: 10 }}>
      <div
        style={{
          height,
          borderRadius: height,
          overflow: 'hidden',
          display: 'flex',
          background: GAM.INK_06,
        }}
      >
        <div style={{ width: '23.3%', background: GAM.GREEN }} />
        <div style={{ width: '60%', background: GAM.INK_10 }} />
        <div style={{ width: '16.7%', background: GAM.RED }} />
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -((12 - height) / 2 + 3),
          left: `calc(${dotLeftPct}% - 6px)`,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: GAM.AMBER,
          border: '2px solid #FFFFFF',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
      />
    </div>
  );
};

const LeaguesCard: React.FC<Props> = ({ userId, isOwner }) => {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useMyLeague(userId);

  if (isLoading) {
    return (
      <div style={{ padding: '10px 20px' }}>
        <div style={{ height: 220, background: GAM.INK_06, borderRadius: 14 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: '10px 20px' }}>
        <div style={{ background: '#FFFFFF', border: `1px solid ${GAM.INK_10}`, borderRadius: 14, padding: 14, fontSize: 13, color: GAM.INK_70, fontFamily: GAM.FONT_GEIST }}>
          Couldn't load your league standings
        </div>
      </div>
    );
  }
  if (!data) {
    // Empty / not in league
    return (
      <div style={{ padding: '10px 20px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${GAM.INK_10}`,
            borderRadius: 14,
            padding: 14,
            opacity: 0.85,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: GAM.INK_55, textTransform: 'uppercase' }}>
            Leagues
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: GAM.INK, marginTop: 4 }}>
            Your league starts soon
          </div>
          <div style={{ fontSize: 12, color: GAM.INK_55, marginTop: 4 }}>
            Pods refresh at season start. You'll be placed automatically.
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = daysUntil(data.season_end);
  const podSize = data.podSize || 30;
  const bracketLabel = data.bracket.charAt(0).toUpperCase() + data.bracket.slice(1);
  const emoji = BRACKET_EMOJI[data.bracket.toLowerCase()] ?? '🏆';
  const ptsToPromote = data.zone !== 'promotion' && data.promoteCut != null
    ? Math.max(0, data.promoteCut + 1 - data.current_points)
    : 0;
  const bufferDown = data.zone !== 'relegation' && data.relegateCut != null
    ? Math.max(0, data.current_points - data.relegateCut)
    : 0;

  const isRelegate = data.zone === 'relegation';
  const isPromote = data.zone === 'promotion';

  return (
    <>
      <div style={{ padding: '10px 20px' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            textAlign: 'left',
            background: '#FFFFFF',
            border: `1px solid ${isRelegate ? GAM.RED : GAM.INK_10}`,
            borderRadius: 14,
            padding: 14,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: GAM.INK_55, textTransform: 'uppercase' }}>
              Leagues · {data.season || 'Season'} · {daysLeft}d left
            </div>
            <span style={{ fontSize: 18 }} aria-hidden>{emoji}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK, marginTop: 4 }}>
            {bracketLabel} League
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: GAM.INK, lineHeight: 1, ...GAM.TABULAR }}>
              #{data.live_rank}
            </span>
            <span style={{ fontSize: 13, color: GAM.INK_55 }}>of {podSize}</span>
          </div>
          <div style={{ fontSize: 12, color: GAM.INK_55, marginTop: 4, ...GAM.TABULAR }}>
            {data.current_points} pts · {data.rounds_counted} rounds counted
          </div>

          <PromoBar rank={data.live_rank} podSize={podSize} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: GAM.INK_55, fontWeight: 600, letterSpacing: 0.3 }}>
            <span>↑ promote (7)</span>
            <span>middle</span>
            <span>↓ relegate (5)</span>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {isPromote && (
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: GAM.GREEN_14, color: GAM.GREEN, fontSize: 12, fontWeight: 700 }}>
                +{bufferDown} pts buffer to keep promotion
              </div>
            )}
            {isRelegate && (
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: GAM.RED_14, color: GAM.RED, fontSize: 12, fontWeight: 700 }}>
                Drop {Math.max(0, (data.relegateCut ?? 0) - data.current_points + 1)} pts and you relegate
              </div>
            )}
            {!isPromote && !isRelegate && (
              <>
                <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: GAM.GREEN_14, color: GAM.GREEN, fontSize: 12, fontWeight: 700, ...GAM.TABULAR }}>
                  ↑ {ptsToPromote} pts to promote
                </div>
                <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: GAM.INK_06, color: GAM.INK_70, fontSize: 12, fontWeight: 700, ...GAM.TABULAR }}>
                  +{bufferDown} pts buffer down
                </div>
              </>
            )}
          </div>
        </button>
      </div>
      <LeaguesSheet
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        myRow={data}
      />
    </>
  );
};

export default LeaguesCard;
