import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Top100TierId } from '@/lib/top100Club';
import { TIER_BY_ID } from '@/lib/top100Club';

interface Top100AchievementBadgeProps {
  tier: Top100TierId | null;
  showSubtitle?: boolean;
  size?: 'default' | 'compact';
  className?: string;
}

// Map tier ring colors to Tailwind color classes for border/bg/icon
function getTierColorClasses(ringColor: string) {
  // Map hex colors to approximate Tailwind classes
  const colorMap: Record<string, { border: string; bg: string; icon: string }> = {
    '#C9B27A': { border: 'border-[#C9B27A]', bg: 'bg-[#C9B27A]/10', icon: 'text-[#C9B27A]' },
    '#7CC66B': { border: 'border-[#7CC66B]', bg: 'bg-[#7CC66B]/10', icon: 'text-[#7CC66B]' },
    '#2F7D32': { border: 'border-[#2F7D32]', bg: 'bg-[#2F7D32]/10', icon: 'text-[#2F7D32]' },
    '#D8A546': { border: 'border-[#D8A546]', bg: 'bg-[#D8A546]/10', icon: 'text-[#D8A546]' },
    '#4A4A4A': { border: 'border-[#4A4A4A]', bg: 'bg-[#4A4A4A]/10', icon: 'text-[#4A4A4A]' },
    '#6F5BD5': { border: 'border-[#6F5BD5]', bg: 'bg-[#6F5BD5]/10', icon: 'text-[#6F5BD5]' },
    '#B153CE': { border: 'border-[#B153CE]', bg: 'bg-[#B153CE]/10', icon: 'text-[#B153CE]' },
    '#111111': { border: 'border-[#111111]', bg: 'bg-[#111111]/10', icon: 'text-[#111111]' },
  };
  return colorMap[ringColor] ?? { border: 'border-slate-400', bg: 'bg-slate-100', icon: 'text-slate-500' };
}

export function Top100AchievementBadge({ 
  tier, 
  showSubtitle = true, 
  size = 'default',
  className 
}: Top100AchievementBadgeProps) {
  if (!tier || tier === 'none') return null;
  
  const tierMeta = TIER_BY_ID[tier];
  if (!tierMeta) return null;

  const colors = getTierColorClasses(tierMeta.ringColor);
  const isCompact = size === 'compact';

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border bg-white shadow-sm whitespace-nowrap',
        colors.border,
        isCompact ? 'px-3 py-1.5 gap-2' : 'px-4 py-2 gap-3',
        className
      )}
    >
      {/* Trophy icon circle */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full border bg-white/70',
          colors.border,
          isCompact ? 'h-7 w-7' : 'h-8 w-8'
        )}
      >
        <Trophy
          className={cn(
            'shrink-0',
            isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4',
            colors.icon
          )}
        />
      </div>

      {/* Text content */}
      <div className="flex flex-col items-center leading-tight">
        {showSubtitle && (
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500 text-center">
            Achievement unlocked
          </span>
        )}
        <span
          className={cn(
            'font-semibold text-slate-900 text-center',
            isCompact ? 'text-xs' : 'text-sm'
          )}
        >
          {tierMeta.tierName}
        </span>
      </div>
    </div>
  );
}
