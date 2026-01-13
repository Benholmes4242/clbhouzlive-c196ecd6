import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useRoundScores } from '@/features/events/hooks/useScores';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  roundId: string;
  isOrganizer: boolean;
}

export function AdminScoresList({ roundId, isOrganizer }: Props) {
  const { data: scores, isLoading } = useRoundScores(roundId);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="w-full h-24 rounded-xl" />
        <Skeleton className="w-full h-24 rounded-xl" />
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No scores recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scores.map(score => {
        const name = score.participant?.user?.display_name || score.participant?.guest_name || 'Unknown';
        const holesPlayed = Object.keys(score.hole_scores || {}).length;

        return (
          <div key={score.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                  {name[0]}
                </div>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {holesPlayed}/18 holes • {score.status}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xl font-bold">{score.total_gross || '--'}</p>
                <p className="text-xs text-muted-foreground">
                  {score.stableford_points ? `${score.stableford_points} pts` : 'gross'}
                </p>
              </div>
            </div>

            {/* Hole scores preview */}
            {score.hole_scores && Object.keys(score.hole_scores).length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => {
                    const strokes = (score.hole_scores as Record<string, number>)?.[hole.toString()];
                    return (
                      <div
                        key={hole}
                        className={cn(
                          'w-7 h-7 rounded text-xs font-medium flex items-center justify-center flex-shrink-0',
                          strokes ? 'bg-muted' : 'bg-transparent text-muted-foreground/50'
                        )}
                      >
                        {strokes || '-'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
