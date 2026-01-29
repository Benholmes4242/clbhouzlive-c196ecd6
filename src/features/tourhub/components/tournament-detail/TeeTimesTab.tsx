/**
 * TeeTimesTab - Round selector with featured groups and all tee times
 * Per Apple-grade redesign spec
 */

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Users, Sun, Sunrise } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '../premium';
import { BatchPlayerAvatar } from '../PlayerAvatar';

interface TeeTime {
  id: string;
  round_number: number;
  tee_time: string;
  tee_number?: number;
  back_nine?: boolean | null;
  raw_data?: any;
}

interface TeeTimesTabProps {
  teeTimes: TeeTime[];
  tournamentName?: string;
}

// Round selector pill
function RoundPill({ 
  round, 
  active, 
  onClick 
}: { 
  round: number; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
        active 
          ? "bg-white text-black" 
          : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90"
      )}
    >
      R{round}
    </button>
  );
}

// Individual tee time row
function TeeTimeRow({ 
  teeTime, 
  players,
}: { 
  teeTime: TeeTime;
  players: { id: string; name: string; score?: string }[];
}) {
  const time = teeTime.tee_time 
    ? format(parseISO(teeTime.tee_time), 'h:mm a')
    : '—';
  
  const holeLabel = teeTime.back_nine ? 'Hole 10' : `Hole ${teeTime.tee_number || 1}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-3 border-b border-white/10"
    >
      {/* Time */}
      <div className="w-20 shrink-0">
        <span className="th-body font-semibold text-white">
          {time}
        </span>
      </div>

      {/* Hole */}
      <div className="w-16 shrink-0">
        <span className="th-caption-1 text-white/50">
          {holeLabel}
        </span>
      </div>

      {/* Players */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {players.map((player, index) => (
          <div 
            key={player.id || index}
            className="flex items-center gap-2 shrink-0"
          >
            <BatchPlayerAvatar
              playerId={player.id}
              playerName={player.name}
              size="sm"
            />
            <span className="th-body-small text-white/80">
              {player.name}
            </span>
            {player.score && (
              <span className={cn(
                "th-caption-1 font-semibold",
                player.score.startsWith('-') ? "text-[hsl(var(--th-accent-birdie))]" :
                player.score.startsWith('+') ? "text-[hsl(var(--th-accent-bogey))]" :
                "text-white/60"
              )}>
                {player.score}
              </span>
            )}
            {index < players.length - 1 && (
              <span className="text-white/20 mx-1">•</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function TeeTimesTab({ teeTimes, tournamentName }: TeeTimesTabProps) {
  // Get available rounds
  const rounds = useMemo(() => {
    const roundSet = new Set(teeTimes.map(t => t.round_number));
    return Array.from(roundSet).sort((a, b) => a - b);
  }, [teeTimes]);

  const [selectedRound, setSelectedRound] = useState(rounds[0] || 1);

  // Filter tee times by round
  const filteredTeeTimes = useMemo(() => {
    return teeTimes
      .filter(t => t.round_number === selectedRound)
      .sort((a, b) => {
        if (!a.tee_time || !b.tee_time) return 0;
        return new Date(a.tee_time).getTime() - new Date(b.tee_time).getTime();
      });
  }, [teeTimes, selectedRound]);

  // Extract players from raw_data
  const getPlayers = (teeTime: TeeTime) => {
    const raw = teeTime.raw_data;
    if (!raw?.players) return [];
    return raw.players.map((p: any) => ({
      id: p.id || '',
      name: p.first_name && p.last_name 
        ? `${p.first_name[0]}. ${p.last_name}` 
        : p.name || 'Unknown',
      score: p.score ? (p.score > 0 ? `+${p.score}` : String(p.score)) : undefined,
    }));
  };

  // Get first tee time for header info
  const firstTeeTime = filteredTeeTimes[0];
  const roundDate = firstTeeTime?.tee_time 
    ? format(parseISO(firstTeeTime.tee_time), 'EEEE, MMMM d')
    : null;

  if (teeTimes.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7 text-white/40" />
        </div>
        <h3 className="th-title-2 text-white mb-1">Tee Times Coming Soon</h3>
        <p className="th-body-small text-white/50">
          Tee times will be posted closer to the tournament.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Round Selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {rounds.map(round => (
          <RoundPill
            key={round}
            round={round}
            active={selectedRound === round}
            onClick={() => setSelectedRound(round)}
          />
        ))}
      </div>

      {/* Round Info Header */}
      {roundDate && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="th-title-2 text-white mb-1">{roundDate}</h3>
              <div className="flex items-center gap-4 th-caption-1 text-white/50">
                <span className="flex items-center gap-1.5">
                  <Sunrise className="w-3.5 h-3.5" />
                  Sunrise: 7:14 AM
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  First Tee: {firstTeeTime?.tee_time 
                    ? format(parseISO(firstTeeTime.tee_time), 'h:mm a')
                    : '—'
                  }
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <Users className="w-4 h-4" />
              <span className="th-body-small">{filteredTeeTimes.length} groups</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tee Times List */}
      <div>
        <h3 className="th-caption-2 text-white/50 mb-3">ALL TEE TIMES</h3>
        <div className="space-y-0">
          {filteredTeeTimes.map(teeTime => (
            <TeeTimeRow
              key={teeTime.id}
              teeTime={teeTime}
              players={getPlayers(teeTime)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
