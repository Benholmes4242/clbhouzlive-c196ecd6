/**
 * EventMomentsList - Display storytelling moments for a tournament
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEventMoments, MOMENT_TYPE_CONFIG, type MomentType } from '../hooks/useEventMoments';

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
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-muted rounded-lg shrink-0" />
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
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
        Key Moments
      </h3>
      
      <div className="space-y-2">
        {displayMoments.map((moment) => {
          const config = MOMENT_TYPE_CONFIG[moment.moment_type as MomentType] || MOMENT_TYPE_CONFIG.highlight;
          
          return (
            <div 
              key={moment.id}
              className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
            >
              {/* Icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base",
                config.color.split(' ')[0]
              )}>
                {config.icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    config.color
                  )}>
                    {config.label}
                  </span>
                  
                  {moment.player && (
                    <Link 
                      to={`/tourhub/player/${moment.player.id}`}
                      className="text-xs text-primary hover:underline truncate"
                    >
                      {moment.player.full_name}
                    </Link>
                  )}
                </div>
                
                <p className="text-sm font-medium text-foreground mt-1 leading-snug">
                  {moment.headline}
                </p>
                
                {moment.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {moment.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {limit && moments.length > limit && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          +{moments.length - limit} more moments
        </p>
      )}
    </div>
  );
}
