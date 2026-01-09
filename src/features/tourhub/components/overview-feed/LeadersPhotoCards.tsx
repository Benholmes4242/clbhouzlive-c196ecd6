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

// Category-specific gradients (fallback when no photo)
const categoryGradients: Record<string, string> = {
  events: 'from-emerald-600 via-emerald-700 to-teal-800',
  cuts: 'from-blue-600 via-blue-700 to-indigo-800',
  scoring: 'from-amber-600 via-orange-700 to-red-800',
  world_rank: 'from-purple-600 via-violet-700 to-indigo-800',
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
          const gradient = categoryGradients[leader.category] || categoryGradients.events;
          
          return (
            <Link
              key={leader.category}
              to={`/tourhub/player/${leader.player.id}`}
              className="group relative overflow-hidden rounded-xl aspect-[4/3]"
            >
              {/* Background - gradient fallback (would be player photo) */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <pattern id={`pattern-${leader.category}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill={`url(#pattern-${leader.category})`} />
                  </svg>
                </div>
              </div>
              
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Content overlay */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                {/* Category label */}
                <span className="self-start px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium">
                  {leader.label}
                </span>
                
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
