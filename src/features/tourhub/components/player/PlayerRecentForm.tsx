/**
 * PlayerRecentForm - Simple label showing recent form from last 5 results
 * "Recent Form: Strong (avg. T4)" — color-coded
 */

import { cn } from '@/lib/utils';
import { usePlayerResults } from '../../hooks/usePlayerResults';

interface PlayerRecentFormProps {
  playerId: string;
}

export function PlayerRecentForm({ playerId }: PlayerRecentFormProps) {
  const { data: results, isLoading } = usePlayerResults(playerId, 5);

  if (isLoading || !results || results.length === 0) return null;

  // Calculate average finish from completed results
  const completedResults = results.filter(r => r.position !== null && r.status !== 'cut' && r.status !== 'MC');
  if (completedResults.length === 0) return null;

  const avgPosition = Math.round(
    completedResults.reduce((sum, r) => sum + (r.position || 0), 0) / completedResults.length
  );

  let formLabel: string;
  let formColor: string;

  if (avgPosition <= 5) {
    formLabel = 'Excellent';
    formColor = 'text-emerald-600 bg-emerald-500/10';
  } else if (avgPosition <= 10) {
    formLabel = 'Strong';
    formColor = 'text-emerald-500 bg-emerald-500/8';
  } else if (avgPosition <= 25) {
    formLabel = 'Steady';
    formColor = 'text-amber-600 bg-amber-500/8';
  } else {
    formLabel = 'Struggling';
    formColor = 'text-red-500 bg-red-500/8';
  }

  return (
    <div className="px-5 mt-3">
      <span className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
        formColor
      )}>
        Recent Form: {formLabel} (avg. T{avgPosition})
      </span>
    </div>
  );
}