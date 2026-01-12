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
    <div className="border-t border-border/30 pt-8 mt-8">
      <div className="flex items-center gap-3">
        {/* Subtle lock icon */}
        <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
          <Lock className="w-3 h-3 text-muted-foreground/60" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            More coming soon
          </p>
        </div>
      </div>
      
      {/* Items - inline, subtle */}
      <div className="flex flex-wrap gap-2 mt-3 ml-9">
        {items.map(item => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-muted-foreground/60 text-[10px] border border-border/30"
          >
            {itemIcons[item.key] || <Lock className="w-2.5 h-2.5" />}
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
