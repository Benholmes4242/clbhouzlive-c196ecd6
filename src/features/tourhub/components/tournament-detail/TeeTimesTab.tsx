/**
 * TeeTimesTab - Tee time pairings grouped by round
 * 
 * Features:
 * - Round selector
 * - Grouped tee time cards with player details
 * - Starting hole indicator
 * - Loading skeleton and empty state
 */

import { useState, useMemo } from 'react';
import { Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { RoundSelector } from './RoundSelector';
import { useTourTeeTimesEnriched } from '../../hooks/useTourHubData';

interface TeeTimesTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
}

// Loading skeleton
function TeeTimesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-11 bg-muted rounded-[14px]" />
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-10 bg-muted rounded-xl" />
            <div className="h-10 bg-muted rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state
function TeeTimesEmpty() {
  return (
    <motion.div
      className="flex items-center justify-center py-20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
          <Clock className="w-8 h-8 text-muted-foreground/70" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Tee Times Not Available</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
            Tee times will be posted closer to the tournament start.
          </p>
        </div>
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

export function TeeTimesTab({ tournamentId }: TeeTimesTabProps) {
  const [selectedRound, setSelectedRound] = useState('R1');
  
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
      // Extract players from raw_data or joined players
      let players: TeeTimeGroup['players'] = [];

      if (tt.players && tt.players.length > 0) {
        // Use joined player data
        players = tt.players.map((tp: any) => ({
          id: tp.id,
          name: tp.player?.full_name || 'Unknown',
          country: tp.player?.country_code || tp.player?.country,
          photoUrl: tp.player?.photo_url,
          playerId: tp.player?.id || tp.player_id,
        }));
      } else if (tt.raw_data?.players) {
        // Fallback to raw_data
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

  if (isLoading) return <TeeTimesSkeleton />;
  if (!teeTimes || teeTimes.length === 0) return <TeeTimesEmpty />;

  return (
    <motion.div
      className="space-y-4"
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{groups.length} groups • Round {roundNumber}</span>
      </div>

      {/* Tee time groups */}
      <div className="space-y-3">
        {groups.map((group, groupIdx) => (
          <motion.div
            key={`${group.teeTime}-${groupIdx}`}
            className="bg-card rounded-2xl border border-border p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.03, duration: 0.3 }}
          >
            {/* Time header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {format(new Date(group.teeTime), 'h:mm a')}
                </span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Hole {group.startingHole}
              </span>
            </div>

            {/* Players */}
            <div className="space-y-0 divide-y divide-border/50">
              {group.players.map((player, playerIdx) => (
                <div
                  key={player.id || playerIdx}
                  className={cn(
                    "flex items-center gap-3 py-2",
                    playerIdx === 0 && "pt-0",
                    playerIdx === group.players.length - 1 && "pb-0 border-b-0"
                  )}
                >
                  <BatchPlayerAvatar
                    playerId={player.playerId || ''}
                    playerName={player.name}
                    fallbackPhotoUrl={player.photoUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {player.name}
                    </p>
                    {player.country && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {player.country}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
