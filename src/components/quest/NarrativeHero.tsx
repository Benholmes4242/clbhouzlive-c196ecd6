/**
 * NarrativeHero - Emotional story-driven hero section
 * Full-width, no card, decorative trophy, narrative copy
 */

import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface NarrativeHeroProps {
  totalPlayed: number;
  target?: number;
}

export const NarrativeHero: React.FC<NarrativeHeroProps> = ({
  totalPlayed,
  target = 100,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  
  // Count-up animation for the main number
  const displayCount = useCountUp({
    end: totalPlayed,
    duration: 1200,
    delay: 600,
    enabled: isVisible,
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Dynamic narrative line based on progress
  const getNarrativeLine = () => {
    if (totalPlayed === 0) return "Your journey awaits";
    if (totalPlayed === 1) return "One legendary course conquered";
    if (totalPlayed < 10) return `${totalPlayed} of the world's greatest courses conquered`;
    if (totalPlayed < 50) return `${totalPlayed} legendary courses in your collection`;
    if (totalPlayed < 100) return `${totalPlayed} courses — a true golfer's legacy`;
    return `${totalPlayed} courses — among the elite`;
  };

  return (
    <section className="relative py-8 text-center">
      {/* Decorative trophy - background element */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none",
          isVisible && !prefersReducedMotion && "quest-animate-fade-in"
        )}
        style={{ animationDelay: '800ms' }}
      >
        <div
          className={cn(
            "relative",
            !prefersReducedMotion && "quest-decorative-trophy"
          )}
        >
          <Trophy 
            className="w-32 h-32 opacity-[0.04]" 
            style={{ color: 'var(--quest-accent-gold)' }}
            strokeWidth={1}
          />
          {/* Ambient glow - very subtle */}
          {!prefersReducedMotion && (
            <div 
              className="absolute inset-0 rounded-full blur-3xl quest-trophy-ambient-glow"
              style={{ 
                background: 'radial-gradient(circle, rgba(210, 180, 97, 0.08) 0%, transparent 70%)',
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Primary headline */}
        <h1
          className={cn(
            "text-3xl font-bold tracking-tight",
            isVisible && !prefersReducedMotion && "quest-animate-fade-up"
          )}
          style={{ 
            color: 'var(--quest-text-primary)',
            animationDelay: '100ms',
          }}
        >
          Your Quest
        </h1>

        {/* Secondary narrative line */}
        <p
          className={cn(
            "text-base",
            isVisible && !prefersReducedMotion && "quest-animate-fade-up"
          )}
          style={{ 
            color: 'var(--quest-text-secondary)',
            animationDelay: '180ms',
          }}
        >
          {getNarrativeLine()}
        </p>

        {/* Progress number - typography treatment */}
        <div 
          className={cn(
            "flex items-baseline justify-center gap-2 pt-2",
            isVisible && !prefersReducedMotion && "quest-animate-fade-up"
          )}
          style={{ animationDelay: '260ms' }}
        >
          <span
            className="text-6xl font-bold tracking-tight"
            style={{ color: 'var(--quest-text-primary)' }}
          >
            {displayCount}
          </span>
          <span
            className="text-2xl font-light"
            style={{ color: 'var(--quest-text-tertiary)' }}
          >
            / {target}
          </span>
        </div>

        {/* Caption */}
        <p
          className={cn(
            "text-xs pt-1",
            isVisible && !prefersReducedMotion && "quest-animate-fade-up"
          )}
          style={{ 
            color: 'var(--quest-text-tertiary)',
            animationDelay: '340ms',
          }}
        >
          Top 100 Courses – Ranked by Clbhouz
        </p>

        {/* Tertiary supporting line */}
        <p
          className={cn(
            "text-sm italic pt-2",
            isVisible && !prefersReducedMotion && "quest-animate-fade-up"
          )}
          style={{ 
            color: 'var(--quest-text-tertiary)',
            animationDelay: '420ms',
            opacity: 0.8,
          }}
        >
          A journey few ever complete
        </p>
      </div>
    </section>
  );
};

export default NarrativeHero;
