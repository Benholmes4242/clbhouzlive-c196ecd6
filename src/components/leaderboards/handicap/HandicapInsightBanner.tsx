import { Trophy, TrendingDown, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HandicapInsightBannerProps {
  userRank?: number | null;
  improvement30d?: number | null;
  mode: 'lowest' | 'improved' | 'season';
}

export function HandicapInsightBanner({ 
  userRank, 
  improvement30d,
  mode 
}: HandicapInsightBannerProps) {
  // Determine which insight to show (priority order)
  let message: string | null = null;
  let Icon = Target;
  let iconColor = '#64748b';

  if (userRank !== null && userRank !== undefined) {
    if (userRank <= 3) {
      message = `You're #${userRank} — leading the pack!`;
      Icon = Trophy;
      iconColor = '#C1A84C';
    } else if (userRank <= 10) {
      const fromTop3 = userRank - 3;
      message = `You're #${userRank} — ${fromTop3 === 1 ? '1 spot' : `${fromTop3} spots`} from the podium`;
      Icon = Trophy;
      iconColor = '#334E3D';
    } else if (userRank <= 25) {
      message = `You're #${userRank} — keep pushing for Top 10!`;
      Icon = Target;
      iconColor = '#334E3D';
    }
  }

  // Show improvement insight if in improved/season mode and has improvement
  if (!message && improvement30d !== null && improvement30d !== undefined && improvement30d > 0) {
    if (mode === 'improved') {
      message = `Great progress: -${improvement30d.toFixed(1)} in 30 days`;
      Icon = TrendingDown;
      iconColor = '#334E3D';
    } else if (mode === 'season') {
      message = `Season improvement: -${improvement30d.toFixed(1)}`;
      Icon = TrendingDown;
      iconColor = '#334E3D';
    }
  }

  // Don't render if no meaningful insight
  if (!message) {
    return null;
  }

  return (
    <div className="mx-4 my-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <p className="text-sm text-foreground font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}