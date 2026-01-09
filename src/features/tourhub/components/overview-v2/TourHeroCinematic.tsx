/**
 * TourHeroCinematic - Season Identity Panel with cinematic texture
 */

import { Trophy, Zap, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourHeroCinematicProps {
  tourName: string;
  year: number;
  status: 'live' | 'active' | 'upcoming' | 'completed';
}

export function TourHeroCinematic({ tourName, year, status }: TourHeroCinematicProps) {
  const statusConfig = {
    live: { 
      label: 'Live', 
      className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: <Zap className="w-3 h-3" />
    },
    active: { 
      label: 'In Season', 
      className: 'bg-primary/10 text-primary border-primary/30',
      icon: <Radio className="w-3 h-3" />
    },
    upcoming: { 
      label: 'Upcoming', 
      className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: null
    },
    completed: { 
      label: 'Season Complete', 
      className: 'bg-muted text-muted-foreground border-border',
      icon: null
    },
  };

  const config = statusConfig[status];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      {/* Topographic contour SVG pattern background */}
      <div className="absolute inset-0 opacity-[0.06]">
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="topo-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0 50 Q25 30 50 50 T100 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M0 70 Q25 50 50 70 T100 70" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M0 30 Q25 10 50 30 T100 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="80" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="80" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <circle cx="20" cy="80" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="20" cy="80" r="18" fill="none" stroke="currentColor" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="400" height="200" fill="url(#topo-pattern)" />
        </svg>
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
      
      {/* Subtle grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Trophy icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg" />
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {tourName}
              </h1>
              <p className="text-base text-muted-foreground mt-0.5">
                {year} Season
              </p>
            </div>
          </div>

          {/* Status pill */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0",
            config.className
          )}>
            {config.icon}
            {config.label}
          </div>
        </div>
      </div>
    </div>
  );
}
