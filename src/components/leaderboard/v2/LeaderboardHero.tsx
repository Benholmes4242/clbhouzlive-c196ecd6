/**
 * LeaderboardHero - Cinematic header for the leaderboard
 * Premium dark gradient with subtle world texture
 */

import React from 'react';
import { Globe } from 'lucide-react';

interface LeaderboardHeroProps {
  title?: string;
  subtitle?: string;
  seasonLabel?: string;
}

export function LeaderboardHero({
  title = 'Global Top 100 Race',
  subtitle = "Track the world's most played Top 100 courses.",
  seasonLabel,
}: LeaderboardHeroProps) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background gradient with subtle texture - using global slate */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 0%, hsl(216 10% 32%) 0%, hsl(216 10% 24%) 100%),
            linear-gradient(180deg, hsl(216 10% 28%) 0%, hsl(216 10% 22%) 100%)
          `,
        }}
      />
      
      {/* Subtle contour/grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              hsl(216 10% 50%) 39px,
              hsl(216 10% 50%) 40px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              hsl(216 10% 50%) 39px,
              hsl(216 10% 50%) 40px
            )
          `,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 px-5 pt-6 pb-5">
        {/* Season label (optional) */}
        {seasonLabel && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            {seasonLabel}
          </span>
        )}
        
        {/* Title row */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center backdrop-blur-sm border border-white/[0.06]">
            <Globe className="w-5 h-5 text-white/70" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {title}
          </h1>
        </div>
        
        {/* Subtitle */}
        <p className="text-[13px] text-white/50 mt-2.5 leading-relaxed max-w-[280px]">
          {subtitle}
        </p>
      </div>
      
      {/* Bottom gradient fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-3"
        style={{
          background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))',
        }}
      />
    </div>
  );
}
