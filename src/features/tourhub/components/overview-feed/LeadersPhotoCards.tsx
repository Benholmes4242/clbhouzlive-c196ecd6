/**
 * LeadersPhotoCards - Season Leaders Highlight Gallery
 * Taller cards, category icon in corner, gradient tint per category
 * Text hierarchy: Big number → Category → Player name
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Target, Scissors, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { toTitleCase } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { SeasonLeader } from '../../hooks/useTourOverviewData';

interface LeadersPhotoCardsProps {
  leaders: SeasonLeader[];
}

// Category-specific styling with gradient tints and icons
const categoryStyles: Record<string, { 
  gradient: string; 
  accent: string; 
  icon: React.ReactNode;
  tint: string;
}> = {
  events: { 
    gradient: 'from-emerald-900/90 via-emerald-800/60', 
    accent: 'bg-emerald-500',
    icon: <Calendar className="w-3.5 h-3.5" />,
    tint: 'bg-emerald-500/20',
  },
  cuts: { 
    gradient: 'from-blue-900/90 via-blue-800/60', 
    accent: 'bg-blue-500',
    icon: <Scissors className="w-3.5 h-3.5" />,
    tint: 'bg-blue-500/20',
  },
  scoring: { 
    gradient: 'from-amber-900/90 via-orange-800/60', 
    accent: 'bg-amber-500',
    icon: <Target className="w-3.5 h-3.5" />,
    tint: 'bg-amber-500/20',
  },
  world_rank: { 
    gradient: 'from-purple-900/90 via-violet-800/60', 
    accent: 'bg-purple-500',
    icon: <Trophy className="w-3.5 h-3.5" />,
    tint: 'bg-purple-500/20',
  },
};

export function LeadersPhotoCards({ leaders }: LeadersPhotoCardsProps) {
  if (!leaders.length) return null;

  return (
    <div className="space-y-6">
      {/* Header - matching Schedule page section headers */}
      <div className="flex items-center justify-between">
        <h3 
          className="font-extrabold text-slate-800 uppercase"
          style={{ fontSize: '13px', letterSpacing: '0.08em' }}
        >
          Season Leaders
        </h3>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
        >
          All leaders <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 2-column grid - taller cards */}
      <div className="grid grid-cols-2 gap-3">
        {leaders.map((leader, index) => {
          const style = categoryStyles[leader.category] || categoryStyles.events;
          const playerPhotoUrl = leader.player.photoUrl;
          
          return (
            <motion.div
              key={leader.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={`/tourhub/player/${leader.player.id}`}
                className="group relative overflow-hidden rounded-xl aspect-[3/4] shadow-md hover:shadow-xl transition-shadow block"
              >
                {/* Background - player photo or gradient fallback */}
                {playerPhotoUrl ? (
                  <>
                    <img
                      src={playerPhotoUrl}
                      alt={leader.player.name}
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Category-tinted overlay */}
                    <div className={cn("absolute inset-0", style.tint)} />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                  </>
                ) : (
                  <>
                    {/* Gradient fallback with initials */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} to-slate-900`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white/15">
                          {leader.player.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </>
                )}
                
                {/* Content overlay */}
                <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
                  {/* Category icon in corner */}
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      style.accent
                    )}>
                      <span className="text-white">{style.icon}</span>
                    </div>
                  </div>
                  
                  {/* Bottom content - improved hierarchy */}
                  <div>
                    {/* Big stat number - most prominent */}
                    <p className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg leading-none">
                      {leader.formattedValue}
                    </p>
                    
                    {/* Category label */}
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wide mt-2">
                      {leader.label}
                    </p>
                    
                    {/* Player name */}
                    <p className="text-white font-semibold text-sm mt-1 truncate group-hover:text-white/90 transition-colors">
                      {leader.player.name}
                    </p>
                    
                    {/* Country */}
                    {leader.player.country && (
                      <p className="text-white/50 text-xs mt-0.5">
                        {toTitleCase(leader.player.country)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
