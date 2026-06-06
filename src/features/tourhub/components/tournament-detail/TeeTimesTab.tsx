/**
 * TeeTimesTab - Flat ruled tee time pairings
 */

import { useState, useMemo } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { RoundSelector } from './RoundSelector';
import { EditorialEmpty } from './EditorialEmpty';
import { useTourTeeTimesEnriched, useTourLeaderboard } from '../../hooks/useTourHubData';
import CountryFlag from '@/components/ui/country-flag';
import { playerRoute } from '../../routes';
import { AMBER, INK, INK_FAINT, INK_MUTE, INK_TINT_02, INK_TINT_05, INK_TINT_06, INK_TINT_07, SCORE_OVER_PAR_LIGHT, SCORE_UNDER_PAR_LIGHT, SURFACE } from '../../_shared/tokens';

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
    <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
      {/* Section rule skeleton */}
      <div className="animate-pulse" style={{ padding: '14px 20px 10px' }}>
        <div style={{ height: '9px', width: '160px', background: INK_TINT_06, borderRadius: '4px' }} />
      </div>
      {/* Column header skeleton */}
      <div style={{ height: '28px', background: INK_TINT_02, borderTop: `0.5px solid ${INK_TINT_07}`, borderBottom: `0.5px solid ${INK_TINT_07}` }} />
      {/* Group rows */}
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse" style={{ padding: '11px 20px', borderBottom: i < 3 ? `0.5px solid ${INK_TINT_07}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '60px', height: '13px', background: INK_TINT_06, borderRadius: '4px' }} />
            <div style={{ width: '30px', height: '11px', background: INK_TINT_06, borderRadius: '4px' }} />
          </div>
          {[1, 2, 3].map(j => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0 4px 72px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '34%', background: INK_TINT_05 }} />
              <div style={{ width: '120px', height: '12px', background: INK_TINT_05, borderRadius: '4px' }} />
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

interface TeeTimeGroup {
  teeTime: string;
  startingHole: number;
  backNine: boolean;
  players: Array<{
    id: string;
    name: string;
    country?: string;
    photoUrl?: string | null;
    playerId?: string;
  }>;
}

function TeeTimeGroupCard({ group, searchQuery, tournamentName, scoreByPlayer, showScores, isFeatured }: { group: TeeTimeGroup; index: number; searchQuery: string; tournamentName?: string; scoreByPlayer: Map<string, ScoreInfo>; showScores: boolean; isFeatured?: boolean }) {
  const hasMatchingPlayer = searchQuery.trim() && group.players.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const accent = hasMatchingPlayer || isFeatured;
  return (
    <div style={{
      borderBottom: `0.5px solid ${INK_TINT_07}`,
      borderLeft: accent ? `3px solid ${AMBER}` : '3px solid transparent',
      background: accent ? 'rgba(247,147,30,0.03)' : 'transparent',
    }}>
      {/* Time + hole row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 20px 5px' }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: INK, width: '72px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {format(new Date(group.teeTime), 'h:mm a')}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: INK, flexShrink: 0 }}>
          Hole {group.startingHole}
        </span>
        {group.backNine && <span style={{ fontSize: '10px', color: INK, marginLeft: '6px' }}>Back 9</span>}
        {isFeatured && !hasMatchingPlayer && (
          <span style={{ marginLeft: '8px', fontSize: '9px', fontWeight: 800, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Featured</span>
        )}
      </div>
      {/* Players */}
      <div style={{ padding: '0 20px 10px 72px' }}>
        {group.players.map((player, playerIdx) => {
          const pid = player.playerId || player.id || '';
          const s = showScores ? scoreByPlayer.get(pid) : undefined;
          return (
            <Link
              key={player.id || playerIdx}
              {...playerRoute(pid, tournamentName ? { kind: 'tournament', tournamentName } : undefined)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', textDecoration: 'none' }}
              className="active:opacity-70 transition-opacity"
            >
              <BatchPlayerAvatar playerId={pid} playerName={player.name} size="sm" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: INK, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{player.name}</span>
              {player.country && <CountryFlag country={player.country} size="sm" />}
              {s && (() => {
                const isMissed = s.status === 'CUT' || s.status === 'WD' || s.status === 'DQ' || s.status === 'MC';
                if (isMissed) {
                  return <span style={{ fontSize: '12px', fontWeight: 700, color: INK, width: '64px', textAlign: 'right' as const, flexShrink: 0 }}>{s.status === 'CUT' || s.status === 'MC' ? 'MC' : s.status}</span>;
                }
                const val = s.score == null ? '—' : s.score === 0 ? 'E' : s.score < 0 ? String(s.score) : `+${s.score}`;
                const color = s.score == null ? INK : s.score < 0 ? SCORE_UNDER_PAR_LIGHT : s.score > 0 ? SCORE_OVER_PAR_LIGHT : INK;
                const posStr = s.position == null ? '' : `${s.tied ? 'T' : ''}${s.position}`;
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, width: '64px', justifyContent: 'flex-end', flexShrink: 0 }}>
                    {posStr && <span style={{ fontSize: '10px', fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{posStr}</span>}
                    <span style={{ fontSize: '14px', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                  </span>
                );
              })()}
            </Link>
          );
        })}
      </div>
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
      let players: TeeTimeGroup['players'] = [];
      if (tt.players && tt.players.length > 0) {
        players = tt.players.map((tp: any) => ({
          id: tp.id,
          name: tp.player?.full_name || 'Unknown',
          country: tp.player?.country_code || tp.player?.country,
          photoUrl: tp.player?.photo_url,
          playerId: tp.player?.id || tp.player_id,
        }));
      } else if (tt.raw_data?.players) {
        players = tt.raw_data.players.map((p: any) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          country: p.country,
          photoUrl: null,
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

  const hasSplitTees = useMemo(() => {
    const holes = new Set(groups.map(g => g.startingHole));
    return holes.size > 1;
  }, [groups]);

  const groupedByHole = useMemo(() => {
    if (!hasSplitTees) return null;
    const map = new Map<number, TeeTimeGroup[]>();
    filteredGroups.forEach(g => {
      const arr = map.get(g.startingHole) || [];
      arr.push(g);
      map.set(g.startingHole, arr);
    });
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [filteredGroups, hasSplitTees]);

  // Hoisted above the state-gated early returns so the hook count is identical
  // across loading / empty / loaded renders (Rules of Hooks / #310 fix).
  const featuredTeeTime = useMemo(() => {
    if (!showScores) return null;
    let bestPos = Infinity; let bestTime: string | null = null;
    for (const g of groups) {
      for (const p of g.players) {
        const pos = scoreByPlayer.get(p.playerId || p.id || '')?.position ?? Infinity;
        if (pos != null && pos < bestPos) { bestPos = pos; bestTime = g.teeTime; }
      }
    }
    return bestTime;
  }, [groups, scoreByPlayer, showScores]);

  if (isLoading) return <TeeTimesSkeleton />;
  if (!teeTimes || teeTimes.length === 0) {
    return <TeeTimesEmpty isCompleted={isCompleted} roundLabel={!availableRounds.includes(selectedRound) ? `Round ${roundNumber}` : undefined} />;
  }

  const teeTimeDate = groups[0]?.teeTime ? format(new Date(groups[0].teeTime), 'EEE, MMM d, yyyy') : null;
  const firstOff = groups[0]?.teeTime ? format(new Date(groups[0].teeTime), 'h:mm a') : null;
  const lastOff = groups.length > 0 ? format(new Date(groups[groups.length - 1].teeTime), 'h:mm a') : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Round selector */}
      {showRoundTabs && (
        <div style={{ padding: '8px 20px 4px' }}>
          <RoundSelector rounds={availableRounds} activeRound={selectedRound} onRoundChange={setSelectedRound} />
        </div>
      )}

      {/* Section eyebrow */}
      <div style={{ padding: '0 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: INK, letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1 }}>
            Tee Times · {teeTimeDate ?? `Round ${roundNumber}`}
          </span>
          <span style={{ fontSize: '10px', color: INK }}>{groups.length} groups</span>
        </div>
      </div>

      {/* Search input */}
      <div style={{ padding: '8px 20px', position: 'relative' }}>
        <Search className="absolute left-[32px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] z-10" style={{ color: INK_FAINT }} strokeWidth={2.5} />
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
            className="absolute right-[32px] top-1/2 -translate-y-1/2 p-1 rounded-full active:scale-90 active:opacity-70 transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Caption: window of tee times */}
      <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '9px', fontWeight: 800, color: INK, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Tee Times · {selectedRound}
        </span>
        {firstOff && lastOff && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: INK, fontVariantNumeric: 'tabular-nums' }}>
            {firstOff} – {lastOff}
          </span>
        )}
      </div>

      {/* Groups */}
      <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}` }}>
        {filteredGroups.length === 0 && searchQuery && (
          <div style={{ textAlign: 'center' as const, padding: '24px 20px' }}>
            <p style={{ fontSize: '14px', color: INK_FAINT }}>No players matching "{searchQuery}"</p>
          </div>
        )}

        {hasSplitTees && groupedByHole ? (
          groupedByHole.map(([hole, holeGroups]) => (
            <div key={hole}>
              <p style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', textTransform: 'uppercase' as const, padding: '10px 20px 4px' }}>
                Hole {hole} Start
              </p>
              {holeGroups.map((group, idx) => (
                <TeeTimeGroupCard key={`${group.teeTime}-${idx}`} group={group} index={idx} searchQuery={searchQuery} tournamentName={tournamentName} scoreByPlayer={scoreByPlayer} showScores={showScores} isFeatured={group.teeTime === featuredTeeTime} />
              ))}
            </div>
          ))
        ) : (
          filteredGroups.map((group, idx) => (
            <TeeTimeGroupCard key={`${group.teeTime}-${idx}`} group={group} index={idx} searchQuery={searchQuery} tournamentName={tournamentName} scoreByPlayer={scoreByPlayer} showScores={showScores} isFeatured={group.teeTime === featuredTeeTime} />
          ))
        )}
      </div>

      {/* Timezone note */}
      <div style={{ textAlign: 'center' as const, padding: '12px 20px 32px' }}>
        <span style={{ fontSize: '10px', color: INK_FAINT }}>Times shown in your local timezone</span>
      </div>
    </motion.div>
  );
}
