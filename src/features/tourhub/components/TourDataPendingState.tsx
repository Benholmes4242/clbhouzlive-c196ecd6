/**
 * TourDataPendingState - Premium "data integration in progress" component
 * 
 * Dark theme compatible cinematic placeholder for pending features.
 * Used for: Summary, Tee Times, Hole-by-Hole tabs.
 */

import { cn } from '@/lib/utils';
import { Sparkles, Globe } from 'lucide-react';
import { GlassCard } from './premium';

interface TourDataPendingStateProps {
  featureTitle?: string;
  featureDescription?: string;
  className?: string;
}

export function TourDataPendingState({ 
  featureTitle = 'More Tour Data',
  featureDescription = 'Live tee times, tournament recaps, hole-by-hole insights, and more.',
  className 
}: TourDataPendingStateProps) {
  return (
    <div className={cn("flex items-center justify-center py-16 px-4", className)}>
      <GlassCard className="w-full max-w-md p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-th-accent/20 to-th-accent/5 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-th-accent" />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2">
          {featureTitle} Unlocking Soon
        </h3>
        <p className="text-sm text-white/60 leading-relaxed mb-6">
          {featureDescription}
        </p>
        
        {/* Body */}
        <p className="text-sm text-white/50 leading-relaxed mb-6">
          We're integrating with <span className="font-medium text-white/70">Sportradar</span> — 
          the world's leading sports data provider — to bring you comprehensive tour coverage.
        </p>
        
        {/* Status badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-white/60">
              Integration in progress
            </span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-white/30">
          <Globe className="w-3 h-3" />
          <span>Powered by SportsRadar</span>
          <span className="text-white/20">·</span>
          <span>Check back soon</span>
        </div>
      </GlassCard>
    </div>
  );
}
