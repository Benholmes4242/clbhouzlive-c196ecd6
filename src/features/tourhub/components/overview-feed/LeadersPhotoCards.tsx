/**
 * LeadersPhotoCards - Photo-backed leader cards (broadcast style)
 * Each card has player photo background with stats overlay
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { SeasonLeader } from '../../hooks/useTourOverviewData';

interface LeadersPhotoCardsProps {
  leaders: SeasonLeader[];
}

// Category-specific accent colors for overlay
const categoryColors: Record<string, { gradient: string; accent: string }> = {
  events: { gradient: 'from-emerald-900/90 via-emerald-800/60', accent: 'bg-emerald-500' },
  cuts: { gradient: 'from-blue-900/90 via-blue-800/60', accent: 'bg-blue-500' },
  scoring: { gradient: 'from-amber-900/90 via-orange-800/60', accent: 'bg-amber-500' },
  world_rank: { gradient: 'from-purple-900/90 via-violet-800/60', accent: 'bg-purple-500' },
};

export function LeadersPhotoCards({ leaders }: LeadersPhotoCardsProps) {
  if (!leaders.length) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">Season Leaders</h3>
        <Link 
          to="/tourhub?tab=player-stats"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          All stats <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {leaders.map((leader) => {
          const colors = categoryColors[leader.category] || categoryColors.events;
          const playerPhotoUrl = leader.player.photoUrl;
          
          return (
            <Link
              key={leader.category}
              to={`/tourhub/player/${leader.player.id}`}
              className="group relative overflow-hidden rounded-xl aspect-[4/3]"
            >
              {/* Background - player photo or gradient fallback */}
              {playerPhotoUrl ? (
                <>
                  <img
                    src={playerPhotoUrl}
                    alt={leader.player.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Dark overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                </>
              ) : (
                <>
                  {/* Gradient fallback with initials */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} to-slate-900`}>
                    {/* Large initials as fallback */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white/20">
                        {leader.player.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </>
              )}
              
              {/* Content overlay */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                {/* Category label with accent color */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.accent}`} />
                  <span className="text-white/90 text-[10px] font-medium uppercase tracking-wide">
                    {leader.label}
                  </span>
                </div>
                
                {/* Bottom content */}
                <div>
                  {/* Big stat number */}
                  <p className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                    {leader.formattedValue}
                  </p>
                  
                  {/* Player name */}
                  <p className="text-white font-semibold text-sm mt-1 truncate group-hover:text-white/90 transition-colors">
                    {leader.player.name}
                  </p>
                  
                  {/* Country */}
                  {leader.player.country && (
                    <p className="text-white/60 text-xs mt-0.5">
                      {leader.player.country}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
