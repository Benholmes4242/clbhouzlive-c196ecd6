/**
 * LeaderboardHero - Premium flat header for the leaderboard
 * Solid charcoal surface with subtle border, no gradients
 */

import React from 'react';
import { Trophy } from 'lucide-react';

interface LeaderboardHeroProps {
  title?: string;
  subtitle?: string;
  seasonLabel?: string;
}

export function LeaderboardHero({
  title = 'Top 100 Championship',
  subtitle = "Climb the rankings by playing the world's greatest courses.",
  seasonLabel,
}: LeaderboardHeroProps) {
  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl mx-0"
      style={{
        background: '#1F1F1F',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Content - reduced height */}
      <div className="relative z-10 px-4 py-3">
        {/* Season label (optional) */}
        {seasonLabel && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/50 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
            {seasonLabel}
          </span>
        )}
        
        {/* Title row */}
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-white/40" />
          <h1 className="text-base font-bold text-white tracking-tight">
            {title}
          </h1>
        </div>
        
        {/* Subtitle */}
        <p className="text-[11px] text-white/50 mt-1 leading-relaxed max-w-[280px]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
