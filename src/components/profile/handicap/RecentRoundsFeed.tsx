import React, { useState } from 'react';
import { Calendar, MapPin, Trophy, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RoundData {
  id: string;
  date: string;
  courseName: string;
  score: number;
  par: number;
  differential: number;
  handicapAfter: number;
  handicapBefore?: number;
  moodRating?: 'great' | 'good' | 'okay' | 'poor';
  weather?: string;
  tees?: string;
}

interface RecentRoundsFeedProps {
  rounds: RoundData[];
  isLoading?: boolean;
  onRoundClick?: (round: RoundData) => void;
}

const getMoodEmoji = (mood?: RoundData['moodRating']) => {
  switch (mood) {
    case 'great': return '😄';
    case 'good': return '😊'; 
    case 'okay': return '😐';
    case 'poor': return '😔';
    default: return '⛳';
  }
};

const getHandicapTrend = (before?: number, after?: number) => {
  if (!before || !after) return null;
  
  const difference = after - before;
  if (Math.abs(difference) < 0.1) return { type: 'neutral' as const, value: 0 };
  
  return {
    type: difference > 0 ? 'up' as const : 'down' as const,
    value: Math.abs(difference)
  };
};

const RoundCard: React.FC<{ 
  round: RoundData; 
  onClick?: (round: RoundData) => void;
}> = ({ round, onClick }) => {
  const trend = getHandicapTrend(round.handicapBefore, round.handicapAfter);
  const scoreToPar = round.score - round.par;
  
  return (
    <div 
      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all duration-200 cursor-pointer group"
      onClick={() => onClick?.(round)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Course and Date */}
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-white/60" />
            <span className="font-medium text-white">{round.courseName}</span>
            <span className="text-xs text-white/50">•</span>
            <span className="text-sm text-white/70">{round.date}</span>
          </div>
          
          {/* Score and Performance */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-white/60" />
              <span className="text-white font-medium">
                {round.score}
              </span>
              <span className="text-white/50 text-sm">
                ({scoreToPar > 0 ? '+' : ''}{scoreToPar})
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-sm">
              <span className="text-white/60">Diff:</span>
              <span className="text-white">{round.differential.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        {/* Mood and Trend */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-lg">{getMoodEmoji(round.moodRating)}</div>
          </div>
          
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend.type === 'up' ? (
                <TrendingUp className="h-3 w-3 text-red-400" />
              ) : trend.type === 'down' ? (
                <TrendingDown className="h-3 w-3 text-green-400" />
              ) : null}
              {trend.value > 0 && (
                <span className={trend.type === 'up' ? 'text-red-400' : 'text-green-400'}>
                  {trend.value.toFixed(1)}
                </span>
              )}
            </div>
          )}
          
          <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white/70 transition-colors" />
        </div>
      </div>
    </div>
  );
};

const RoundDetailModal: React.FC<{
  round: RoundData | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ round, isOpen, onClose }) => {
  if (!round) return null;
  
  const scoreToPar = round.score - round.par;
  const trend = getHandicapTrend(round.handicapBefore, round.handicapAfter);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {round.courseName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Date</h4>
              <p className="text-sm">{round.date}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Score</h4>
              <p className="text-sm">
                {round.score} ({scoreToPar > 0 ? '+' : ''}{scoreToPar})
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Differential</h4>
              <p className="text-sm">{round.differential.toFixed(1)}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Handicap After</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm">{round.handicapAfter.toFixed(1)}</span>
                {trend && trend.value > 0 && (
                  <div className="flex items-center gap-1">
                    {trend.type === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-red-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-green-400" />
                    )}
                    <span className={`text-xs ${trend.type === 'up' ? 'text-red-400' : 'text-green-400'}`}>
                      {trend.value.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Round Rating</h4>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMoodEmoji(round.moodRating)}</span>
                <span className="text-sm capitalize">{round.moodRating || 'Not rated'}</span>
              </div>
            </div>
            {round.tees && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Tees</h4>
                <p className="text-sm">{round.tees}</p>
              </div>
            )}
          </div>
          
          {round.weather && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Weather</h4>
              <p className="text-sm">{round.weather}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RecentRoundsFeed: React.FC<RecentRoundsFeedProps> = ({ 
  rounds, 
  isLoading = false,
  onRoundClick 
}) => {
  const [selectedRound, setSelectedRound] = useState<RoundData | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'score'>('recent');

  const handleRoundClick = (round: RoundData) => {
    setSelectedRound(round);
    onRoundClick?.(round);
  };

  const sortedRounds = [...rounds].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return a.score - b.score; // Best score first
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-white/20 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-white/50" />
        <p className="text-white/70 mb-2">No rounds recorded yet</p>
        <p className="text-sm text-white/50">
          Start tracking your golf rounds to see them here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Sort by:</span>
          <Button
            variant={sortBy === 'recent' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('recent')}
            className="h-7 px-3 text-xs"
          >
            Most Recent
          </Button>
          <Button
            variant={sortBy === 'score' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('score')}
            className="h-7 px-3 text-xs"
          >
            Best Score
          </Button>
        </div>
        
        {/* Rounds list */}
        <div className="space-y-3">
          {sortedRounds.map((round) => (
            <RoundCard 
              key={round.id} 
              round={round} 
              onClick={handleRoundClick}
            />
          ))}
        </div>
      </div>
      
      {/* Round detail modal */}
      <RoundDetailModal
        round={selectedRound}
        isOpen={!!selectedRound}
        onClose={() => setSelectedRound(null)}
      />
    </>
  );
};

export default RecentRoundsFeed;