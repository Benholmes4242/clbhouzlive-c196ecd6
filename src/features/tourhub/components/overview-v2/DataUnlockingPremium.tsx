/**
 * DataUnlockingPremium - Premium lock panel with shimmer animation
 */

import { Lock, Trophy, Clock, BarChart3, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UnlockingItem {
  key: string;
  label: string;
  locked: boolean;
}

interface DataUnlockingPremiumProps {
  items: UnlockingItem[];
}

const iconMap: Record<string, React.ReactNode> = {
  leaderboards: <Trophy className="w-4 h-4" />,
  'tee-times': <Clock className="w-4 h-4" />,
  'hole-stats': <BarChart3 className="w-4 h-4" />,
  fedex: <Zap className="w-4 h-4" />,
};

export function DataUnlockingPremium({ items }: DataUnlockingPremiumProps) {
  const [shimmerOffset, setShimmerOffset] = useState(0);

  // Subtle shimmer sweep every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShimmerOffset(prev => (prev + 1) % 2);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!items.length) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-amber-500/5">
      {/* Shimmer sweep */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-1000"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.1), transparent)',
          transform: `translateX(${shimmerOffset * 100 - 50}%)`,
        }}
      />
      
      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            {/* Lock pulse animation */}
            <div className="absolute inset-0 bg-amber-500/20 rounded-lg animate-pulse" />
            <div className="relative w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">More Data Unlocking Soon</h3>
            <p className="text-xs text-muted-foreground">Live Tour feeds unlock automatically as coverage goes live</p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="p-3 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="text-muted-foreground/60">
                  {iconMap[item.key] || <Lock className="w-4 h-4" />}
                </div>
                <span className="text-xs font-medium text-foreground/70">{item.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500/40 animate-pulse" />
                <span className="text-[10px] text-muted-foreground/60">Coming soon</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
