import React, { useState } from 'react';
import { MapPin, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

interface AnonymousGameCardProps {
  game: {
    id: string;
    course_name: string | null;
    tee_time: string | null;
    game_type: string;
    players_needed: number | null;
    host_handicap: number | null;
    other_player_handicaps: number[] | null;
  };
  onRequestJoin: (gameId: string) => void;
  hasRequested?: boolean;
}

export function AnonymousGameCard({ game, onRequestJoin, hasRequested }: AnonymousGameCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTeeTime = (teeTime: string | null) => {
    if (!teeTime) return 'Time TBD';
    
    const date = parseISO(teeTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today • ${format(date, 'h:mm a')}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow • ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'EEE, MMM d • h:mm a');
    }
  };

  const getGameTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '9_holes': '9 holes',
      '18_holes': '18 holes',
      'casual_golf': 'Casual golf',
      'practice': 'Practice',
    };
    return labels[type] || type;
  };

  const calculatePlayerInfo = () => {
    const handicaps = [game.host_handicap, ...(game.other_player_handicaps || [])].filter(h => h !== null) as number[];
    const playerCount = handicaps.length;
    
    if (handicaps.length > 0) {
      const min = Math.min(...handicaps);
      const max = Math.max(...handicaps);
      return {
        count: playerCount,
        handicapRange: min === max ? `Handicap ${min}` : `Handicaps ${min}–${max}`,
      };
    }
    
    return {
      count: 1,
      handicapRange: null,
    };
  };

  const playerInfo = calculatePlayerInfo();
  const playersNeeded = game.players_needed || 0;

  return (
    <Card className="p-4 bg-card border-border">
      {/* Main Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{game.course_name || 'Course TBD'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-foreground text-base font-semibold mb-2">
              <Clock className="w-4 h-4" />
              <span>{formatTeeTime(game.tee_time)}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {playerInfo.count} {playerInfo.count === 1 ? 'player' : 'players'} so far
              </span>
              
              {playerInfo.handicapRange && (
                <>
                  <span>•</span>
                  <span>{playerInfo.handicapRange}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{getGameTypeLabel(game.game_type)}</span>
              {playersNeeded > 0 && (
                <>
                  <span>•</span>
                  <span className="text-primary font-medium">
                    Needs {playersNeeded} more
                  </span>
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-border space-y-1 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Host handicap:</span> {game.host_handicap || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Playing with:</span> {Math.max(0, playerInfo.count - 1)} other {playerInfo.count - 1 === 1 ? 'member' : 'members'}
            </div>
            <div>
              <span className="font-medium">Course:</span> {game.course_name || 'TBD'}
            </div>
            <div>
              <span className="font-medium">Looking for:</span> {playersNeeded} more
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="pt-3">
          {playersNeeded > 0 ? (
            <Button
              onClick={() => onRequestJoin(game.id)}
              disabled={hasRequested}
              className="w-full"
              size="lg"
            >
              {hasRequested ? 'Requested' : 'Request to Join'}
            </Button>
          ) : (
            <Button disabled className="w-full" size="lg">
              Full
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
