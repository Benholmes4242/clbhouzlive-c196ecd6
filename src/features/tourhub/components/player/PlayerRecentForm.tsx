/**
 * PlayerRecentForm - Full-width tinted strip with trend icon
 * showing recent form assessment from last 5 results.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerResults } from '../../hooks/usePlayerResults';

interface PlayerRecentFormProps {
  playerId: string;
}

export function PlayerRecentForm({ playerId }: PlayerRecentFormProps) {
  const { data: results, isLoading } = usePlayerResults(playerId, 5);

  if (isLoading || !results || results.length === 0) return null;

  const completedResults = results.filter(r => r.position !== null && r.status !== 'cut' && r.status !== 'MC');
  if (completedResults.length === 0) return null;

  const avgPosition = Math.round(
    completedResults.reduce((sum, r) => sum + (r.position || 0), 0) / completedResults.length
  );

  let formLabel: string;
  let stripClass: string;
  let Icon: React.ElementType;

  if (avgPosition <= 5) {
    formLabel = 'Excellent';
    stripClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
    Icon = TrendingUp;
  } else if (avgPosition <= 10) {
    formLabel = 'Strong';
    stripClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/8 dark:text-emerald-400';
    Icon = TrendingUp;
  } else if (avgPosition <= 25) {
    formLabel = 'Steady';
    stripClass = 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    Icon = Minus;
  } else {
    formLabel = 'Struggling';
    stripClass = 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400';
    Icon = TrendingDown;
  }

  return (
    <div className={cn("px-4 py-3 flex items-center gap-2", stripClass)}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm font-semibold">
        {formLabel} · avg. T{avgPosition} in last {completedResults.length} events
      </span>
    </div>
  );
}
