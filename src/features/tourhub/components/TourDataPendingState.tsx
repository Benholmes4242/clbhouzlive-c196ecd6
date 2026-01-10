/**
 * TourDataPendingState - Premium "data integration in progress" component
 * 
 * A world-class, intentional placeholder for features pending Sportradar integration.
 * Used for: Summary, Tee Times, Hole-by-Hole tabs where data is coming soon.
 */

import { cn } from '@/lib/utils';
import { Sparkles, Globe, ArrowRight } from 'lucide-react';

interface TourDataPendingStateProps {
  /** The specific feature being integrated */
  featureTitle?: string;
  /** Brief description of what's coming */
  featureDescription?: string;
  className?: string;
}

export function TourDataPendingState({ 
  featureTitle = 'More Tour Data',
  featureDescription = 'Live tee times, tournament recaps, hole-by-hole insights, and more.',
  className 
}: TourDataPendingStateProps) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <div className="w-full max-w-[480px] mx-auto text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {featureTitle} Unlocking Soon
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px] mx-auto">
            {featureDescription}
          </p>
        </div>
        
        {/* Body */}
        <div className="text-sm text-muted-foreground/80 leading-relaxed max-w-[400px] mx-auto space-y-3">
          <p>
            We're integrating with <span className="font-medium text-foreground/80">Sportradar</span> — 
            the world's leading sports data provider — to bring you comprehensive tour coverage.
          </p>
        </div>
        
        {/* Status badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">
              Integration in progress
            </span>
          </div>
        </div>
        
        {/* Footer link - subtle */}
        <div className="pt-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
            <Globe className="w-3 h-3" />
            <span>Powered by SportsRadar</span>
            <span className="text-muted-foreground/30">·</span>
            <span>Check back soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
