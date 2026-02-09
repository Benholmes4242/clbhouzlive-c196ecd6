/**
 * SeasonSnapshotCinematic - Dominant stat + supporting chips with count-up animation
 */

import { useEffect, useState, useRef } from 'react';
import { Calendar, Users, BarChart3, Flag } from 'lucide-react';
import type { SeasonSnapshotStats } from '../../hooks/useTourOverviewData';

interface SeasonSnapshotCinematicProps {
  stats: SeasonSnapshotStats;
}

function useCountUp(end: number, duration: number = 600) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || end === 0) {
      setCount(end);
      return;
    }

    hasAnimated.current = true;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

export function SeasonSnapshotCinematic({ stats }: SeasonSnapshotCinematicProps) {
  const eventsPlayed = useCountUp(stats.eventsPlayed);
  const totalEvents = useCountUp(stats.totalEvents);
  const players = useCountUp(stats.playersCount);
  const categories = useCountUp(stats.statCategories);
  const remaining = useCountUp(stats.eventsRemaining);

  const isComplete = stats.eventsRemaining === 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground px-1">Season at a Glance</h3>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Dominant Stat Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 sm:flex-1">
          {/* Background icon watermark */}
          <div className="absolute -right-4 -bottom-4 opacity-[0.04]">
            <Calendar className="w-32 h-32" />
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Events Played</span>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-5xl sm:text-6xl font-bold text-foreground tracking-tight">
                {eventsPlayed}
              </span>
              <span className="text-2xl sm:text-3xl font-medium text-muted-foreground">
                /{totalEvents}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mt-2">
              {isComplete ? 'Season complete' : `${remaining} events remaining`}
            </p>
          </div>
        </div>

        {/* Supporting Stats Column */}
        <div className="flex flex-row sm:flex-col gap-3 sm:w-48">
          {/* Players */}
          <div className="flex-1 rounded-xl border border-border bg-card p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{players}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Players</div>
          </div>

          {/* Stat Categories */}
          <div className="flex-1 rounded-xl border border-border bg-card p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{categories}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Stat Types</div>
          </div>

          {/* Events Left */}
          <div className="flex-1 rounded-xl border border-border bg-card p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Flag className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{remaining}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Events Left</div>
          </div>
        </div>
      </div>
    </div>
  );
}
