import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type Top100Tier = 20 | 50 | 100 | 200 | 300 | 400;

const tierStyles: Record<Top100Tier, { ring: string; icon: string }> = {
  20:  { ring: "border-sky-500",     icon: "text-sky-500" },
  50:  { ring: "border-emerald-500", icon: "text-emerald-500" },
  100: { ring: "border-amber-500",   icon: "text-amber-500" },
  200: { ring: "border-violet-500",  icon: "text-violet-500" },
  300: { ring: "border-slate-500",   icon: "text-slate-500" },
  400: { ring: "border-slate-900",   icon: "text-slate-900" },
};

interface Top100AchievementBadgeProps {
  tier: Top100Tier | null;
}

export function Top100AchievementBadge({ tier }: Top100AchievementBadgeProps) {
  if (!tier) return null;
  
  const style = tierStyles[tier];

  return (
    <section className="flex justify-center">
      <div className="inline-flex items-center gap-4 rounded-full bg-white px-7 py-4 shadow-sm border border-slate-100">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white",
            style.ring
          )}
        >
          <Trophy className={cn("h-4 w-4", style.icon)} />
        </div>

        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
            Achievement unlocked
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {tier} Club
          </p>
        </div>
      </div>
    </section>
  );
}
