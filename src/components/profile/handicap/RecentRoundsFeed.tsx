import React, { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
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

const RoundRow: React.FC<{ 
  round: RoundData; 
  onClick?: (round: RoundData) => void;
}> = ({ round, onClick }) => {
  const trend = getHandicapTrend(round.handicapBefore, round.handicapAfter);
  const scoreToPar = round.score - round.par;
  
  return (
    <div 
      className="flex items-center justify-between gap-3 py-3 cursor-pointer group"
      onClick={() => onClick?.(round)}
    >
      <div className="flex-1 min-w-0">
        {/* Course name */}
        <p className="text-sm font-semibold text-foreground truncate">
          {round.courseName}
        </p>
        {/* Score and diff */}
        <p className="text-xs text-muted-foreground mt-0.5">
          {round.score} ({scoreToPar > 0 ? '+' : ''}{scoreToPar}) · Score Diff: {round.differential.toFixed(1)}
        </p>
      </div>
      
      {/* Right side: emoji + trend */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-lg">{getMoodEmoji(round.moodRating)}</span>
        
        {trend && trend.value > 0 && (
          <div className="flex items-center gap-0.5">
            {trend.type === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span className={`text-xs font-medium ${trend.type === 'up' ? 'text-destructive' : 'text-emerald-600'}`}>
              {trend.value.toFixed(1)}
            </span>
          </div>
        )}
        
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
            {round.courseName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-xs text-muted-foreground mb-1">Date</h4>
              <p className="text-sm">{round.date}</p>
            </div>
            <div>
              <h4 className="font-medium text-xs text-muted-foreground mb-1">Score</h4>
              <p className="text-sm">
                {round.score} ({scoreToPar > 0 ? '+' : ''}{scoreToPar})
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-xs text-muted-foreground mb-1">Differential</h4>
              <p className="text-sm">{round.differential.toFixed(1)}</p>
            </div>
            <div>
              <h4 className="font-medium text-xs text-muted-foreground mb-1">Handicap After</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm">{round.handicapAfter.toFixed(1)}</span>
                {trend && trend.value > 0 && (
                  <div className="flex items-center gap-1">
                    {trend.type === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-destructive" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-emerald-600" />
                    )}
                    <span className={`text-xs ${trend.type === 'up' ? 'text-destructive' : 'text-emerald-600'}`}>
                      {trend.value.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-xs text-muted-foreground mb-1">Round Rating</h4>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMoodEmoji(round.moodRating)}</span>
                <span className="text-sm capitalize">{round.moodRating || 'Not rated'}</span>
              </div>
            </div>
            {round.tees && (
              <div>
                <h4 className="font-medium text-xs text-muted-foreground mb-1">Tees</h4>
                <p className="text-sm">{round.tees}</p>
              </div>
            )}
          </div>
          
          {round.weather && (
            <div>
              <h4 className="font-medium text-xs text-muted-foreground mb-1">Weather</h4>
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
          <div key={i} className="bg-muted rounded-sq-md p-4 animate-pulse">
            <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">No rounds recorded yet</p>
        <p className="text-sm text-muted-foreground">
          Start tracking your golf rounds to see them here
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <div className="inline-flex rounded-sq-pill bg-muted/70 border border-border/60 p-0.5">
          <button
            type="button"
            onClick={() => setSortBy('recent')}
            className={[
              'px-2.5 py-1 text-xs font-medium rounded-sq-pill transition-all',
              sortBy === 'recent'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            Most Recent
          </button>
          <button
            type="button"
            onClick={() => setSortBy('score')}
            className={[
              'px-2.5 py-1 text-xs font-medium rounded-sq-pill transition-all',
              sortBy === 'score'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            Best Score
          </button>
        </div>
      </div>
      
      {/* Rounds list */}
      <div className="divide-y divide-border">
        {sortedRounds.map((round) => (
          <RoundRow 
            key={round.id} 
            round={round} 
            onClick={handleRoundClick}
          />
        ))}
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
