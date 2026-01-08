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
    <div className="relative w-full overflow-hidden rounded-b-2xl mx-0">
      {/* Background gradient - softer charcoal instead of harsh black */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 100% at 50% -20%, hsl(220 12% 38%) 0%, hsl(220 10% 28%) 60%, hsl(220 8% 22%) 100%)
          `,
        }}
      />
      
      {/* Subtle world-grid/contour overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 29px,
              hsl(220 15% 60%) 29px,
              hsl(220 15% 60%) 30px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 29px,
              hsl(220 15% 60%) 29px,
              hsl(220 15% 60%) 30px
            )
          `,
        }}
      />
      
      {/* Corner vignette for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 100%, transparent 50%, hsl(220 10% 18% / 0.4) 100%),
            radial-gradient(circle at 0% 0%, hsl(220 10% 10% / 0.3) 0%, transparent 40%),
            radial-gradient(circle at 100% 0%, hsl(220 10% 10% / 0.3) 0%, transparent 40%)
          `,
        }}
      />
      
      {/* Content - reduced vertical padding */}
      <div className="relative z-10 px-5 pt-4 pb-4">
        {/* Season label (optional) */}
        {seasonLabel && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/50 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
            {seasonLabel}
          </span>
        )}
        
        {/* Title row */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.1] flex items-center justify-center backdrop-blur-sm border border-white/[0.08]">
            <Globe className="w-4.5 h-4.5 text-white/80" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            {title}
          </h1>
        </div>
        
        {/* Subtitle */}
        <p className="text-[12px] text-white/55 mt-2 leading-relaxed max-w-[260px]">
          {subtitle}
        </p>
      </div>
      
      {/* Soft bottom fade into page background */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-4"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.6) 60%, hsl(var(--background)) 100%)',
        }}
      />
    </div>
  );
}
