import React, { useState, useEffect } from 'react';
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useMyScore, useCreateScore, useUpdateHoleScore, useCompleteScore } from '@/features/events/hooks/useScores';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  roundId: string;
  participantId: string;
  playingHandicap: number;
  courseName: string;
  pars?: number[];
}

const DEFAULT_PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4];

export function ScoreEntrySheet({ open, onClose, roundId, participantId, playingHandicap, courseName, pars = DEFAULT_PARS }: Props) {
  const [currentHole, setCurrentHole] = useState(1);
  const [localScores, setLocalScores] = useState<Record<number, number | null>>({});

  const { data: existingScore, isLoading } = useMyScore(roundId, participantId);
  const { mutate: createScore } = useCreateScore();
  const { mutate: updateHoleScore, isPending: isUpdating } = useUpdateHoleScore();
  const { mutate: completeScore, isPending: isCompleting } = useCompleteScore();

  // Initialize from existing score
  useEffect(() => {
    if (existingScore?.hole_scores) {
      const scores: Record<number, number> = {};
      Object.entries(existingScore.hole_scores).forEach(([hole, strokes]) => {
        scores[parseInt(hole)] = strokes as number;
      });
      setLocalScores(scores);
    }
  }, [existingScore]);

  // Create score record if doesn't exist
  useEffect(() => {
    if (open && !existingScore && !isLoading) {
      createScore({ roundId, participantId });
    }
  }, [open, existingScore, isLoading, roundId, participantId, createScore]);

  const currentPar = pars[currentHole - 1] || 4;
  const currentStrokes = localScores[currentHole];

  const handleScoreSelect = (strokes: number) => {
    setLocalScores(prev => ({ ...prev, [currentHole]: strokes }));
    
    if (existingScore) {
      updateHoleScore({
        scoreId: existingScore.id,
        hole: currentHole,
        strokes,
        roundId,
      });
    }

    // Auto-advance to next hole
    if (currentHole < 18) {
      setTimeout(() => setCurrentHole(currentHole + 1), 300);
    }
  };

  const handleComplete = () => {
    if (!existingScore) return;
    
    completeScore({
      scoreId: existingScore.id,
      roundId,
      playingHandicap,
      pars,
    }, {
      onSuccess: () => onClose(),
    });
  };

  const totalStrokes = Object.values(localScores).reduce((sum, s) => sum + (s || 0), 0);
  const holesCompleted = Object.values(localScores).filter(s => s !== null && s !== undefined).length;
  const frontNine = [1,2,3,4,5,6,7,8,9].reduce((sum, h) => sum + (localScores[h] || 0), 0);
  const backNine = [10,11,12,13,14,15,16,17,18].reduce((sum, h) => sum + (localScores[h] || 0), 0);

  const scoreOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle>{courseName}</SheetTitle>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
          </SheetHeader>

          {/* Hole Navigation */}
          <div className="flex items-center justify-between px-4 py-6 bg-muted/30">
            <button
              onClick={() => setCurrentHole(Math.max(1, currentHole - 1))}
              disabled={currentHole === 1}
              className="p-2 hover:bg-muted rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Hole</p>
              <p className="text-4xl font-bold">{currentHole}</p>
              <p className="text-sm text-muted-foreground">Par {currentPar}</p>
            </div>
            
            <button
              onClick={() => setCurrentHole(Math.min(18, currentHole + 1))}
              disabled={currentHole === 18}
              className="p-2 hover:bg-muted rounded-full disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Hole Selector */}
          <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
              <button
                key={hole}
                onClick={() => setCurrentHole(hole)}
                className={cn(
                  'w-8 h-8 rounded-full text-sm font-medium flex-shrink-0 transition-colors',
                  currentHole === hole ? 'bg-primary text-primary-foreground' :
                  localScores[hole] !== null && localScores[hole] !== undefined ? 'bg-green-100 text-green-700' : 'bg-muted'
                )}
              >
                {hole}
              </button>
            ))}
          </div>

          {/* Score Entry */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-sm text-muted-foreground mb-3">Select your score</p>
            <div className="grid grid-cols-5 gap-3">
              {scoreOptions.map(score => {
                const diff = score - currentPar;
                const isSelected = currentStrokes === score;
                
                let bgColor = 'bg-muted';
                let textColor = 'text-foreground';
                if (diff <= -2) { bgColor = 'bg-amber-100'; textColor = 'text-amber-700'; }
                else if (diff === -1) { bgColor = 'bg-green-100'; textColor = 'text-green-700'; }
                else if (diff === 0) { bgColor = 'bg-blue-100'; textColor = 'text-blue-700'; }
                else if (diff === 1) { bgColor = 'bg-orange-100'; textColor = 'text-orange-700'; }
                else if (diff >= 2) { bgColor = 'bg-red-100'; textColor = 'text-red-700'; }

                return (
                  <button
                    key={score}
                    onClick={() => handleScoreSelect(score)}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center transition-all',
                      isSelected ? 'ring-2 ring-primary ring-offset-2' : '',
                      bgColor, textColor
                    )}
                  >
                    <span className="text-2xl font-bold">{score}</span>
                    <span className="text-xs">
                      {diff === 0 ? 'Par' : diff > 0 ? `+${diff}` : diff}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score Summary */}
          <div className="p-4 border-t border-border bg-background space-y-4">
            <div className="flex justify-between text-center">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Front 9</p>
                <p className="text-lg font-bold">{frontNine || '-'}</p>
              </div>
              <div className="flex-1 border-x border-border">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{totalStrokes || '-'}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Back 9</p>
                <p className="text-lg font-bold">{backNine || '-'}</p>
              </div>
            </div>
            
            <Button
              onClick={handleComplete}
              disabled={holesCompleted < 18 || isCompleting}
              className="w-full h-12 rounded-xl"
            >
              {isCompleting ? 'Submitting...' : holesCompleted < 18 ? `${holesCompleted}/18 holes` : 'Submit Score'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
