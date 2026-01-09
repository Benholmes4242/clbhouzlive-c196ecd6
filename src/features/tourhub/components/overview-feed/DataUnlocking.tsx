/**
 * DataUnlocking - Quiet premium lock panel near bottom
 * Subtle shimmer animation, not prominent
 */

import { Lock, Radio, Clock, BarChart3, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnlockItem {
  key: string;
  label: string;
}

interface DataUnlockingProps {
  items: UnlockItem[];
}

const itemIcons: Record<string, React.ReactNode> = {
  leaderboards: <BarChart3 className="w-3.5 h-3.5" />,
  'tee-times': <Clock className="w-3.5 h-3.5" />,
  'hole-stats': <Radio className="w-3.5 h-3.5" />,
  fedex: <Trophy className="w-3.5 h-3.5" />,
};

export function DataUnlocking({ items }: DataUnlockingProps) {
  if (!items.length) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/30 p-4">
      {/* Subtle shimmer animation */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          animation: 'shimmer 8s infinite',
        }}
      />
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      <div className="relative flex items-center gap-3">
        {/* Lock icon with pulse */}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-4 h-4 text-muted-foreground animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground/80">
            More data unlocking soon
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live feeds activate as coverage goes live
          </p>
        </div>
      </div>
      
      {/* Items */}
      <div className="relative flex flex-wrap gap-2 mt-3">
        {items.map(item => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs"
          >
            {itemIcons[item.key] || <Lock className="w-3 h-3" />}
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
