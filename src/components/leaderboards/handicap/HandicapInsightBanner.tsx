import { Trophy, TrendingDown, Target } from 'lucide-react';

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
  let isTopRank = false;

  if (userRank !== null && userRank !== undefined) {
    if (userRank <= 3) {
      message = `You're #${userRank} — leading the pack!`;
      Icon = Trophy;
      isTopRank = true;
    } else if (userRank <= 10) {
      const fromTop3 = userRank - 3;
      message = `You're #${userRank} — ${fromTop3 === 1 ? '1 spot' : `${fromTop3} spots`} from the podium`;
      Icon = Trophy;
      isTopRank = true;
    } else if (userRank <= 25) {
      message = `You're #${userRank} — keep pushing for Top 10!`;
      Icon = Target;
      isTopRank = false;
    }
  }

  // Show improvement insight if in improved/season mode and has improvement
  if (!message && improvement30d !== null && improvement30d !== undefined && improvement30d > 0) {
    if (mode === 'improved') {
      message = `Great progress: -${improvement30d.toFixed(1)} in 30 days`;
      Icon = TrendingDown;
      isTopRank = false;
    } else if (mode === 'season') {
      message = `Season improvement: -${improvement30d.toFixed(1)}`;
      Icon = TrendingDown;
      isTopRank = false;
    }
  }

  // Don't render if no meaningful insight
  if (!message) {
    return null;
  }

  return (
    <div className="mx-4 my-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-amber-600" />
        </div>
        <p className="text-sm font-semibold text-amber-900">
          {message}
        </p>
      </div>
    </div>
  );
}