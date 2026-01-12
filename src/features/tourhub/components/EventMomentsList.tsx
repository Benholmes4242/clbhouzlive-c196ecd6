/**
 * EventMomentsList - Display storytelling moments with timeline presentation
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEventMoments, MOMENT_TYPE_CONFIG, type MomentType } from '../hooks/useEventMoments';
import { PlayerAvatar } from './PlayerAvatar';

interface EventMomentsListProps {
  tournamentId: string;
  className?: string;
  limit?: number;
}

export function EventMomentsList({ tournamentId, className, limit }: EventMomentsListProps) {
  const { data: moments, isLoading } = useEventMoments(tournamentId);
  
  if (isLoading) {
    return (
      <div className={cn("space-y-3 animate-pulse", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 bg-muted rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!moments || moments.length === 0) {
    return null;
  }
  
  const displayMoments = limit ? moments.slice(0, limit) : moments;
  
  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Key Moments
        </h3>
      </div>
      
      {/* Timeline container */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border/50" />
        
        <div className="space-y-3">
          {displayMoments.map((moment, index) => {
            const config = MOMENT_TYPE_CONFIG[moment.moment_type as MomentType] || MOMENT_TYPE_CONFIG.highlight;
            
            // Determine border color based on moment type
            const borderColors: Record<string, string> = {
              winner: 'border-l-amber-500',
              ace: 'border-l-amber-500',
              albatross: 'border-l-purple-500',
              eagle: 'border-l-emerald-500',
              record: 'border-l-blue-500',
              comeback: 'border-l-orange-500',
              playoff: 'border-l-red-500',
              milestone: 'border-l-indigo-500',
              streak: 'border-l-orange-500',
              highlight: 'border-l-slate-400',
            };
            const borderColor = borderColors[moment.moment_type] || 'border-l-slate-400';
            
            return (
              <div 
                key={moment.id}
                className={cn(
                  "relative ml-8 p-4 bg-card rounded-lg border border-border/50",
                  "border-l-4",
                  borderColor,
                  "hover:bg-muted/30 transition-colors"
                )}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "absolute -left-[calc(2rem+0.375rem)] top-5 w-3 h-3 rounded-full border-2 border-background",
                  config.color.split(' ')[0]
                )} />
                
                {/* Header: Badge + Player */}
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  {/* Moment type badge */}
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                    config.color
                  )}>
                    <span>{config.icon}</span>
                    {config.label}
                  </span>
                  
                  {/* Player link with avatar */}
                  {moment.player && (
                    <Link 
                      to={`/tourhub/player/${moment.player.id}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <PlayerAvatar
                        playerId={moment.player.id}
                        playerName={moment.player.full_name}
                        size="sm"
                        className="w-6 h-6"
                      />
                      {moment.player.full_name}
                    </Link>
                  )}
                </div>
                
                {/* Headline */}
                <p className="text-sm font-medium text-foreground leading-snug">
                  {moment.headline}
                </p>
                
                {/* Description */}
                {moment.description && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {moment.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Show more indicator */}
      {limit && moments.length > limit && (
        <p className="text-xs text-muted-foreground mt-4 ml-8 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          +{moments.length - limit} more moments
        </p>
      )}
    </div>
  );
}
