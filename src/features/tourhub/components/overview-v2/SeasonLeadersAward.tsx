/**
 * SeasonLeadersAward - Achievement-style cards with broadcast graphic vibe
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Award, Target, Gauge, Trophy, Globe } from 'lucide-react';
import type { SeasonLeader } from '../../hooks/useTourOverviewData';

interface SeasonLeadersAwardProps {
  leaders: SeasonLeader[];
}

const categoryConfig: Record<string, { 
  icon: React.ReactNode; 
  iconBg: string; 
  watermark: React.ReactNode;
  gradient: string;
}> = {
  events: { 
    icon: <Award className="w-5 h-5 text-primary" />,
    iconBg: 'bg-primary/10',
    watermark: <Award className="w-24 h-24" />,
    gradient: 'from-primary/5 via-transparent to-transparent',
  },
  cuts: { 
    icon: <Target className="w-5 h-5 text-emerald-500" />,
    iconBg: 'bg-emerald-500/10',
    watermark: <Target className="w-24 h-24" />,
    gradient: 'from-emerald-500/5 via-transparent to-transparent',
  },
  scoring: { 
    icon: <Gauge className="w-5 h-5 text-blue-500" />,
    iconBg: 'bg-blue-500/10',
    watermark: <Gauge className="w-24 h-24" />,
    gradient: 'from-blue-500/5 via-transparent to-transparent',
  },
  world_rank: { 
    icon: <Globe className="w-5 h-5 text-amber-500" />,
    iconBg: 'bg-amber-500/10',
    watermark: <Trophy className="w-24 h-24" />,
    gradient: 'from-amber-500/5 via-transparent to-transparent',
  },
};

export function SeasonLeadersAward({ leaders }: SeasonLeadersAwardProps) {
  if (!leaders.length) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-foreground text-lg">Season Leaders</h3>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1 transition-colors"
        >
          All stats <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Leaders Grid */}
      <div className="grid grid-cols-2 gap-3">
        {leaders.map((leader) => {
          const config = categoryConfig[leader.category] || categoryConfig.events;
          
          return (
            <Link
              key={leader.category}
              to={`/tourhub/player/${leader.player.id}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
              
              {/* Watermark icon */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.04] text-current">
                {config.watermark}
              </div>
              
              <div className="relative p-4">
                {/* Category */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                    {config.icon}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{leader.label}</span>
                </div>
                
                {/* Player Name */}
                <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors mb-1">
                  {leader.player.name}
                </p>
                
                {/* Country */}
                {leader.player.country && (
                  <p className="text-xs text-muted-foreground mb-2">{leader.player.country}</p>
                )}
                
                {/* Value - prominent */}
                <div className="mt-auto pt-2 border-t border-border/50">
                  <span className="text-lg font-bold text-foreground">
                    {leader.formattedValue}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
