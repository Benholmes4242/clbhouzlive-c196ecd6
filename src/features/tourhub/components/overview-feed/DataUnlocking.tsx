/**
 * DataUnlocking - "More Coming Soon" Tease Section
 * Redesigned as intentional tease with greyed cards, lock icons, blur effect
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

const itemConfig: Record<string, { icon: React.ReactNode; description: string }> = {
  leaderboards: { 
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Real-time tournament scoring',
  },
  'tee-times': { 
    icon: <Clock className="w-5 h-5" />,
    description: 'Round-by-round pairings',
  },
  'hole-stats': { 
    icon: <Radio className="w-5 h-5" />,
    description: 'Per-hole scoring data',
  },
  fedex: { 
    icon: <Trophy className="w-5 h-5" />,
    description: 'Official tour rankings',
  },
};

export function DataUnlocking({ items }: DataUnlockingProps) {
  if (!items.length) return null;

  return (
    <div className="pt-8 mt-4">
      {/* Header - matching Schedule page section headers */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <Lock className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p 
            className="font-extrabold text-slate-800 uppercase"
            style={{ fontSize: '13px', letterSpacing: '0.08em' }}
          >
            More Coming Soon
          </p>
          <p className="text-xs text-slate-500">
            Live leaderboards, tee times & hole stats
          </p>
        </div>
      </div>
      
      {/* Greyed cards with lock icons and blur effect */}
      <div className="grid grid-cols-2 gap-3">
        {items.slice(0, 4).map(item => {
          const config = itemConfig[item.key] || { 
            icon: <Lock className="w-5 h-5" />, 
            description: 'Coming soon' 
          };
          
          return (
            <div
              key={item.key}
              className={cn(
                "relative p-4 rounded-xl",
                "bg-muted/40 border border-border/40",
                "overflow-hidden"
              )}
            >
              {/* Subtle blur overlay */}
              <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-br from-muted/20 to-muted/40 pointer-events-none" />
              
              {/* Content */}
              <div className="relative">
                {/* Icon with lock badge */}
                <div className="relative w-10 h-10 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/80 flex items-center justify-center text-muted-foreground/50">
                    {config.icon}
                  </div>
                  {/* Lock badge */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-muted-foreground/60" />
                  </div>
                </div>
                
                {/* Label */}
                <p className="text-sm font-medium text-slate-600">
                  {item.label}
                </p>
                
                {/* Description */}
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {config.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Subtle footer text */}
      <p className="text-[11px] text-slate-400 text-center mt-5">
        Live data feeds will unlock automatically when available
      </p>
    </div>
  );
}
