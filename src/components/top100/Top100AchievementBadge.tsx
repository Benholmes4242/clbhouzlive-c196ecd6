import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type Top100Tier = 5 | 10 | 20 | 50 | 100 | 200 | 300 | 400;

const tierStyles: Record<Top100Tier, { ring: string; icon: string; name: string }> = {
  5:   { ring: "border-[#D9C7A3]", icon: "text-[#D9C7A3]", name: "Rookie Club" },
  10:  { ring: "border-[#8BBF5A]", icon: "text-[#8BBF5A]", name: "Fairway Club" },
  20:  { ring: "border-[#2E5930]", icon: "text-[#2E5930]", name: "Founders Club" },
  50:  { ring: "border-[#C8A44B]", icon: "text-[#C8A44B]", name: "Heritage Club" },
  100: { ring: "border-[#B7BCC6]", icon: "text-[#B7BCC6]", name: "Century Club" },
  200: { ring: "border-[#D9A441]", icon: "text-[#D9A441]", name: "Elite Club" },
  300: { ring: "border-[#5A3E8C]", icon: "text-[#5A3E8C]", name: "Legendary Club" },
  400: { ring: "border-[#0C0F14]", icon: "text-[#0C0F14]", name: "Grand Slam Club" },
};

interface Top100AchievementBadgeProps {
  tier: Top100Tier | null;
}

export function Top100AchievementBadge({ tier }: Top100AchievementBadgeProps) {
  if (!tier) return null;
  
  const style = tierStyles[tier];

  return (
    <section className="flex justify-center">
      <div
        className={cn(
          "inline-flex items-center gap-4 rounded-full bg-white px-6 py-2.5 shadow-sm max-w-xs w-full",
          style.ring
        )}
        style={{ borderWidth: '1.5px' }}
      >
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
            {style.name}
          </p>
        </div>
      </div>
    </section>
  );
}
