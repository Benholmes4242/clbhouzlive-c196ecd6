/**
 * TeeTimesTab — Flush flat tee-time pairings, stacked players (flag + name).
 * Round-aware: R1–R4 selector via RoundSelector.
 */

import { useState, useMemo } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { RoundSelector } from './RoundSelector';
import { EditorialEmpty } from './EditorialEmpty';
import { useTourTeeTimesEnriched, useTourLeaderboard } from '../../hooks/useTourHubData';
import CountryFlag from '@/components/ui/country-flag';
import { playerRoute } from '../../routes';
import {
  AMBER, INK, INK_FAINT, INK_MUTE, INK_TINT_06, INK_TINT_07,
  SCORE_OVER_PAR_LIGHT, SURFACE,
} from '../../_shared/tokens';

type ScoreInfo = { score: number | null; position: number | null; tied: boolean; status: string | null };

interface TeeTimesTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  tournamentName?: string;
  isLive: boolean;
  isCompleted?: boolean;
}

function TeeTimesSkeleton() {
  return (
    <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
      <div className="animate-pulse" style={{ padding: '14px 16px 10px' }}>
        <div style={{ height: 9, width: 160, background: INK_TINT_06, borderRadius: 4 }} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse" style={{ padding: '12px 16px', borderTop: `0.5px solid ${INK_TINT_07}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 60, height: 13, background: INK_TINT_06, borderRadius: 4 }} />
            <div style={{ width: 30, height: 11, background: INK_TINT_06, borderRadius: 4, marginLeft: 'auto' }} />
          </div>
          {[1, 2, 3].map(j => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <div style={{ width: 16, height: 12, background: INK_TINT_06, borderRadius: 2 }} />
              <div style={{ width: 120, height: 12, background: INK_TINT_06, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TeeTimesEmpty({ isCompleted, roundLabel }: { isCompleted?: boolean; roundLabel?: string }) {
  if (isCompleted) {
    return (
      <EditorialEmpty
        icon={<Clock size={28} strokeWidth={1.8} color="#64748b" />}
        tint="slate"
        eyebrow="Tee Times"
        title="Tee times no longer available"
        body="Historical pairing data isn't kept for completed tournaments."
      />
    );
  }
  if (roundLabel) {
    return (
      <EditorialEmpty
        icon={<Clock size={28} strokeWidth={1.8} color={AMBER} />}
        eyebrow={roundLabel}
        title={`${roundLabel} pairings not yet published`}
        body="Pairings publish after the previous round closes. Check back shortly."
      />
    );
  }
  return (
    <EditorialEmpty
      icon={<Clock size={28} strokeWidth={1.8} color={AMBER} />}
      eyebrow="Tee Times"
      title="Tee times will be posted closer to the start"
      body="Pairings, groupings, and split-tee starts appear here as soon as the field is set."
    />
  );
}

interface TeePlayer {
  id: string;
  name: string;
  country?: string;
  playerId?: string | null;
}

interface TeeTimeGroup {
  teeTime: string;
  startingHole: number;
  backNine: boolean;
  players: TeePlayer[];
}

function TeeTimeGroupRow({
  group, tournamentName, scoreByPlayer, showScores,
}: {
  group: TeeTimeGroup;
  tournamentName?: string;
  scoreByPlayer: Map<string, ScoreInfo>;
  showScores: boolean;
}) {
  return (
    <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${INK_TINT_07}` }}>
      {/* Time + tee header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>
          {format(new Date(group.teeTime), 'h:mm a')}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: INK_MUTE,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Tee {group.startingHole}{group.backNine ? ' · Back 9' : ''}
        </span>
      </div>

      {group.players.map((player, idx) => {
        const pid = player.playerId || player.id || '';
        const s = showScores ? scoreByPlayer.get(pid) : undefined;
        const status = s?.status;
        const missed = status === 'MC' || status === 'CUT' || status === 'WD' || status === 'DQ';
        const val = s
          ? missed
            ? (status === 'CUT' ? 'MC' : status!)
            : s.score == null ? '' : s.score === 0 ? 'E' : s.score < 0 ? String(s.score) : `+${s.score}`
          : '';
        const valColor = s && s.score != null && s.score < 0 ? SCORE_OVER_PAR_LIGHT : INK;

        return (
          <Link
            key={`${player.id}-${idx}`}
            {...playerRoute(pid, tournamentName ? { kind: 'tournament', tournamentName } : undefined)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 0', textDecoration: 'none',
            }}
            className="active:opacity-70 transition-opacity"
          >
            <CountryFlag country={player.country} size="sm" />
            <span style={{
              fontSize: 14, fontWeight: 600, color: INK, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {player.name}
            </span>
            {val && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: valColor,
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              }}>{val}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function TeeTimesTab({ tournamentId, tournamentName, isCompleted }: TeeTimesTabProps) {
  const [selectedRound, setSelectedRound] = useState('R1');
  const [searchQuery, setSearchQuery] = useState('');

  const roundNumber = parseInt(selectedRound.replace('R', ''));
  const { data: teeTimes, isLoading } = useTourTeeTimesEnriched(tournamentId, roundNumber);
  const { data: lb } = useTourLeaderboard(tournamentId);

  const scoreByPlayer = useMemo(() => {
    const m = new Map<string, ScoreInfo>();
    for (const row of (lb ?? [])) {
      const pid = (row as any).player?.id;
      if (pid) m.set(pid, {
        score: (row as any).score ?? null,
        position: (row as any).position ?? null,
        tied: (row as any).position_tied ?? false,
        status: (row as any).status ?? null,
      });
    }
    return m;
  }, [lb]);
  const showScores = scoreByPlayer.size > 0;

  const { data: allTeeTimes } = useTourTeeTimesEnriched(tournamentId);
  const availableRounds = useMemo(() => {
    if (!allTeeTimes || allTeeTimes.length === 0) return ['R1'];
    const rounds = [...new Set(allTeeTimes.map((t: any) => t.round_number))].sort();
    return rounds.map(r => `R${r}`);
  }, [allTeeTimes]);

  const showRoundTabs = availableRounds.length > 1;

  const groups = useMemo((): TeeTimeGroup[] => {
    if (!teeTimes || teeTimes.length === 0) return [];
    return teeTimes.map((tt: any) => {
      let players: TeePlayer[] = [];
      if (tt.players && tt.players.length > 0) {
        players = tt.players.map((tp: any) => ({
          id: tp.id,
          name: tp.player?.full_name || 'Unknown',
          country: tp.player?.country_code || tp.player?.country,
          playerId: tp.player?.id || tp.player_id,
        }));
      } else if (tt.raw_data?.players) {
        players = tt.raw_data.players.map((p: any) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          country: p.country,
          playerId: null,
        }));
      }
      return {
        teeTime: tt.tee_time,
        startingHole: tt.back_nine ? 10 : (tt.tee_number || 1),
        backNine: tt.back_nine || false,
        players,
      };
    }).sort((a: TeeTimeGroup, b: TeeTimeGroup) =>
      new Date(a.teeTime).getTime() - new Date(b.teeTime).getTime()
    );
  }, [teeTimes]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(g => g.players.some(p => p.name.toLowerCase().includes(q)));
  }, [groups, searchQuery]);

  if (isLoading) return <TeeTimesSkeleton />;
  if (!teeTimes || teeTimes.length === 0) {
    return <TeeTimesEmpty isCompleted={isCompleted} roundLabel={!availableRounds.includes(selectedRound) ? `Round ${roundNumber}` : undefined} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Section eyebrow */}
      <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}`, padding: '14px 16px 10px' }}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: INK_MUTE,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          Tee Times · {selectedRound}
        </span>
      </div>

      {/* Round selector */}
      {showRoundTabs && (
        <div style={{ background: SURFACE, padding: '0 16px 10px' }}>
          <RoundSelector rounds={availableRounds} activeRound={selectedRound} onRoundChange={setSelectedRound} />
        </div>
      )}

      {/* Search input */}
      <div style={{ background: SURFACE, padding: '0 16px 10px', position: 'relative' }}>
        <Search className="absolute left-[28px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] z-10" style={{ color: INK_FAINT }} strokeWidth={2.5} />
        <input
          type="text"
          placeholder="Find your player…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-9 rounded-xl text-[13px] bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400/60 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-[28px] top-1/2 -translate-y-1/2 p-1 rounded-full active:scale-90 active:opacity-70 transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Groups */}
      <div style={{ background: SURFACE }}>
        {filteredGroups.length === 0 && searchQuery && (
          <div style={{ textAlign: 'center', padding: '24px 16px', borderTop: `0.5px solid ${INK_TINT_07}` }}>
            <p style={{ fontSize: 14, color: INK_MUTE }}>No players matching "{searchQuery}"</p>
          </div>
        )}

        {filteredGroups.map((group, idx) => (
          <TeeTimeGroupRow
            key={`${group.teeTime}-${idx}`}
            group={group}
            tournamentName={tournamentName}
            scoreByPlayer={scoreByPlayer}
            showScores={showScores}
          />
        ))}
      </div>

      {/* Timezone note */}
      <div style={{ textAlign: 'center', padding: '12px 16px 32px' }}>
        <span style={{ fontSize: 10, color: INK_MUTE }}>Times shown in your local timezone</span>
      </div>
    </motion.div>
  );
}
