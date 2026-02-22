/**
 * TeeTimesTab - Tee time pairings grouped by round
 * 
 * Premium editorial tee times with search, contextual empty states,
 * polished group cards, and tappable player rows.
 */

import { useState, useMemo } from 'react';
import { Clock, Users, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { RoundSelector } from './RoundSelector';
import { useTourTeeTimesEnriched } from '../../hooks/useTourHubData';
import { countryCodeToFlag } from '../../utils/countryFlags';

interface TeeTimesTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
  isCompleted?: boolean;
}

// Loading skeleton
function TeeTimesSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-muted rounded-full w-32" />
      <div className="h-12 bg-muted/50 rounded-xl" />
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/30 px-4 py-2.5">
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
          <div className="p-4 space-y-3">
            <div className="h-10 bg-muted/40 rounded" />
            <div className="h-10 bg-muted/40 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state — contextual messaging
function TeeTimesEmpty({ isCompleted, roundLabel }: { isCompleted?: boolean; roundLabel?: string }) {
  let title = 'Tee Times Not Available Yet';
  let subtitle = 'Tee times will be posted closer to the tournament start.';

  if (isCompleted) {
    title = 'Tee Times No Longer Available';
    subtitle = 'Tee time data is not retained after the tournament ends.';
  } else if (roundLabel) {
    title = `${roundLabel} Tee Times Not Yet Published`;
    subtitle = 'Check back after the previous round for updated pairings.';
  }

  return (
    <motion.div
      className="flex items-center justify-center min-h-[300px] py-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-3">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground/30" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">{subtitle}</p>
      </div>
    </motion.div>
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

export function TeeTimesTab({ tournamentId, isCompleted }: TeeTimesTabProps) {
  const [selectedRound, setSelectedRound] = useState('R1');
  const [searchQuery, setSearchQuery] = useState('');
  
  const roundNumber = parseInt(selectedRound.replace('R', ''));
  const { data: teeTimes, isLoading } = useTourTeeTimesEnriched(tournamentId, roundNumber);

  // Determine available rounds from data
  const { data: allTeeTimes } = useTourTeeTimesEnriched(tournamentId);
  const availableRounds = useMemo(() => {
    if (!allTeeTimes || allTeeTimes.length === 0) return ['R1'];
    const rounds = [...new Set(allTeeTimes.map((t: any) => t.round_number))].sort();
    return rounds.map(r => `R${r}`);
  }, [allTeeTimes]);

  // Group tee times
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
        startingHole: tt.tee_number || (tt.back_nine ? 10 : 1),
        backNine: tt.back_nine || false,
        players,
      };
    }).sort((a: TeeTimeGroup, b: TeeTimeGroup) => 
      new Date(a.teeTime).getTime() - new Date(b.teeTime).getTime()
    );
  }, [teeTimes]);

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(g => g.players.some(p => p.name.toLowerCase().includes(q)));
  }, [groups, searchQuery]);

  // Detect split tees
  const hasSplitTees = useMemo(() => {
    const holes = new Set(groups.map(g => g.startingHole));
    return holes.size > 1;
  }, [groups]);

  // Group by starting hole for split tees
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

  const teeTimeDate = groups[0]?.teeTime ? format(new Date(groups[0].teeTime), 'EEE, MMM d') : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Round selector */}
      {availableRounds.length > 1 && (
        <RoundSelector
          rounds={availableRounds}
          activeRound={selectedRound}
          onRoundChange={setSelectedRound}
        />
      )}

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-4">
        <Users className="w-4 h-4 shrink-0" />
        <span className="tabular-nums">
          {groups.length} groups · Round {roundNumber}
          {teeTimeDate && ` · ${teeTimeDate}`}
        </span>
      </div>

      {/* Search input */}
      <div className="relative px-4 mb-4">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground z-10" strokeWidth={2.5} />
        <input
          type="text"
          placeholder="Find your player…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full h-12 pl-10 pr-10 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/50",
            "bg-muted/50 border border-border",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
            "transition-all duration-200"
          )}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-7 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Tee time groups */}
      <div className="space-y-3 pt-4 px-4">
        {filteredGroups.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No players matching "{searchQuery}"</p>
          </div>
        )}

        {hasSplitTees && groupedByHole ? (
          groupedByHole.map(([hole, holeGroups]) => (
            <div key={hole}>
              <div className="text-xs font-semibold tracking-widest uppercase text-muted-foreground py-2">
                Hole {hole} Start
              </div>
              <div className="space-y-3">
                {holeGroups.map((group, idx) => (
                  <TeeTimeGroupCard key={`${group.teeTime}-${idx}`} group={group} index={idx} searchQuery={searchQuery} />
                ))}
              </div>
            </div>
          ))
        ) : (
          filteredGroups.map((group, idx) => (
            <TeeTimeGroupCard key={`${group.teeTime}-${idx}`} group={group} index={idx} searchQuery={searchQuery} />
          ))
        )}
      </div>

      {/* Timezone note */}
      <div className="text-center py-6">
        <span className="text-[10px] text-muted-foreground italic">All times displayed in tournament local time</span>
      </div>
    </motion.div>
  );
}

// Extracted group card component
function TeeTimeGroupCard({ group, index, searchQuery }: { group: TeeTimeGroup; index: number; searchQuery: string }) {
  const hasMatchingPlayer = searchQuery.trim() && group.players.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div
      className={cn(
        "bg-card rounded-2xl border border-border overflow-hidden",
        hasMatchingPlayer && "ring-2 ring-amber-400"
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4), duration: 0.3 }}
    >
      {/* Group header */}
      <div className="flex items-center justify-between bg-muted/30 px-4 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {format(new Date(group.teeTime), 'h:mm a')}
          </span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Hole {group.startingHole}
        </span>
      </div>

      {/* Player rows */}
      <div>
        {group.players.map((player, playerIdx) => {
          const isLast = playerIdx === group.players.length - 1;
          const flag = countryCodeToFlag(player.country || '');

          const content = (
            <div
              className={cn(
                "flex items-center gap-3 py-3 px-4 transition-all duration-150",
                "hover:bg-muted/40 active:scale-[0.995]",
                !isLast && "border-b border-border/40"
              )}
            >
              <BatchPlayerAvatar
                playerId={player.playerId || ''}
                playerName={player.name}
                
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {player.name}
                </p>
                {player.country && (
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {flag && <span className="mr-1">{flag}</span>}
                    {player.country}
                  </p>
                )}
              </div>
            </div>
          );

          if (player.playerId) {
            return (
              <Link key={player.id || playerIdx} to={`/tourhub/player/${player.playerId}`} className="block">
                {content}
              </Link>
            );
          }

          return <div key={player.id || playerIdx}>{content}</div>;
        })}
      </div>
    </motion.div>
  );
}
