/**
 * TeeTimesTab - Flat ruled tee time pairings
 */

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { RoundSelector } from './RoundSelector';
import { EditorialEmpty } from './EditorialEmpty';
import { useTourTeeTimesEnriched } from '../../hooks/useTourHubData';
import CountryFlag from '@/components/ui/country-flag';
import { playerRoute } from '../../routes';

interface TeeTimesTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  tournamentName?: string;
  isLive: boolean;
  isCompleted?: boolean;
}

function TeeTimesSkeleton() {
  return (
    <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
      {/* Section rule skeleton */}
      <div className="animate-pulse" style={{ padding: '14px 20px 10px' }}>
        <div style={{ height: '9px', width: '160px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
      </div>
      {/* Column header skeleton */}
      <div style={{ height: '28px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }} />
      {/* Group rows */}
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse" style={{ padding: '11px 20px', borderBottom: i < 3 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '60px', height: '13px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
            <div style={{ width: '30px', height: '11px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          </div>
          {[1, 2, 3].map(j => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0 4px 72px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '34%', background: 'rgba(15,23,42,0.05)' }} />
              <div style={{ width: '120px', height: '12px', background: 'rgba(15,23,42,0.05)', borderRadius: '4px' }} />
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
        eyebrow="Tee Times"
        title="Tee times no longer available"
        body="Historical pairing data isn't kept for completed tournaments."
      />
    );
  }
  if (roundLabel) {
    return (
      <EditorialEmpty
        eyebrow={roundLabel}
        title={`${roundLabel} pairings not yet published`}
        body="Pairings publish after the previous round closes. Check back shortly."
      />
    );
  }
  return (
    <EditorialEmpty
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

function TeeTimeGroupCard({ group, index, searchQuery, tournamentName }: { group: TeeTimeGroup; index: number; searchQuery: string; tournamentName?: string }) {
  const hasMatchingPlayer = searchQuery.trim() && group.players.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)', background: hasMatchingPlayer ? 'rgba(247,147,30,0.03)' : 'transparent' }}>
      {/* Time + hole row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 20px 5px' }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', width: '72px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {format(new Date(group.teeTime), 'h:mm a')}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', flexShrink: 0 }}>
          Hole {group.startingHole}
        </span>
        {group.backNine && <span style={{ fontSize: '10px', color: '#94A3B8', marginLeft: '6px' }}>Back 9</span>}
      </div>
      {/* Players */}
      <div style={{ padding: '0 20px 10px 72px' }}>
        {group.players.map((player, playerIdx) => (
          <Link
            key={player.id || playerIdx}
            {...playerRoute(player.playerId || player.id || '', tournamentName ? { kind: 'tournament', tournamentName } : undefined)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', textDecoration: 'none' }}
            className="active:opacity-70 transition-opacity"
          >
            <BatchPlayerAvatar playerId={player.playerId || player.id || ''} playerName={player.name} size="sm" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{player.name}</span>
            {player.country && <CountryFlag country={player.country} size="sm" />}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TeeTimesTab({ tournamentId, isCompleted }: TeeTimesTabProps) {
  const [selectedRound, setSelectedRound] = useState('R1');
  const [searchQuery, setSearchQuery] = useState('');
  
  const roundNumber = parseInt(selectedRound.replace('R', ''));
  const { data: teeTimes, isLoading } = useTourTeeTimesEnriched(tournamentId, roundNumber);

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

  if (isLoading) return <TeeTimesSkeleton />;
  if (!teeTimes || teeTimes.length === 0) {
    return <TeeTimesEmpty isCompleted={isCompleted} roundLabel={!availableRounds.includes(selectedRound) ? `Round ${roundNumber}` : undefined} />;
  }

  const teeTimeDate = groups[0]?.teeTime ? format(new Date(groups[0].teeTime), 'EEE, MMM d, yyyy') : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Round selector */}
      {showRoundTabs && (
        <div style={{ padding: '8px 20px 4px' }}>
          <RoundSelector rounds={availableRounds} activeRound={selectedRound} onRoundChange={setSelectedRound} />
        </div>
      )}

      {/* Section rule marker */}
      <div style={{ padding: '0 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1 }} />
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1 }}>
            Tee Times · {teeTimeDate ?? `Round ${roundNumber}`}
          </span>
          <span style={{ fontSize: '10px', color: '#94A3B8' }}>{groups.length} groups</span>
        </div>
      </div>

      {/* Search input */}
      <div style={{ padding: '8px 20px', position: 'relative' }}>
        <Search className="absolute left-[32px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] z-10" style={{ color: '#94A3B8' }} strokeWidth={2.5} />
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

      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
        <span style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', width: '72px', flexShrink: 0 }}>TIME</span>
        <span style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', width: '52px', flexShrink: 0 }}>HOLE</span>
        <span style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flex: 1 }}>PLAYERS</span>
      </div>

      {/* Groups */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        {filteredGroups.length === 0 && searchQuery && (
          <div style={{ textAlign: 'center' as const, padding: '24px 20px' }}>
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>No players matching "{searchQuery}"</p>
          </div>
        )}

        {hasSplitTees && groupedByHole ? (
          groupedByHole.map(([hole, holeGroups]) => (
            <div key={hole}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '10px 20px 4px' }}>
                Hole {hole} Start
              </p>
              {holeGroups.map((group, idx) => (
                <TeeTimeGroupCard key={`${group.teeTime}-${idx}`} group={group} index={idx} searchQuery={searchQuery} />
              ))}
            </div>
          ))
        ) : (
          filteredGroups.map((group, idx) => (
            <TeeTimeGroupCard key={`${group.teeTime}-${idx}`} group={group} index={idx} searchQuery={searchQuery} />
          ))
        )}
      </div>

      {/* Timezone note */}
      <div style={{ textAlign: 'center' as const, padding: '12px 20px 32px' }}>
        <span style={{ fontSize: '10px', color: '#94A3B8' }}>Times shown in your local timezone</span>
      </div>
    </motion.div>
  );
}
