/**
 * QuestHero - Hero section with premium animations
 * Features: Glass badge, count-up animation, ambient pulse
 */

import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface QuestHeroProps {
  totalPlayed: number;
  target?: number;
  seasonLabel?: string;
  hasPremiumAccent?: boolean;
}

export const QuestHero: React.FC<QuestHeroProps> = ({
  totalPlayed,
  target = 100,
  seasonLabel,
  hasPremiumAccent = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  
  // Count-up animation for the main number
  const displayCount = useCountUp({
    end: totalPlayed,
    duration: 1200,
    delay: 400,
    enabled: isVisible,
  });

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="text-center py-4">
      {/* Trophy Badge - Premium Glass Container */}
      <div 
        className={cn(
          "flex justify-center mb-4",
          isVisible && !prefersReducedMotion && "quest-animate-scale-in quest-delay-1"
        )}
      >
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center quest-trophy-container",
            !prefersReducedMotion && "quest-ambient-pulse"
          )}
        >
          <Trophy 
            className="w-8 h-8" 
            style={{ color: '#B8A053' }}
            strokeWidth={1.8}
          />
        </div>
      </div>

      {/* Progress Number with Count-up */}
      <div 
        className={cn(
          "flex items-baseline justify-center gap-1.5 mb-1",
          isVisible && !prefersReducedMotion && "quest-animate-fade-up quest-delay-2"
        )}
      >
        <span
          className="text-[3.5rem] font-bold leading-none tracking-tight"
          style={{ color: 'var(--quest-text-primary)' }}
        >
          {displayCount}
        </span>
        <span
          className="text-xl font-normal"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          / {target}
        </span>
      </div>

      {/* Label */}
      <p
        className={cn(
          "text-sm font-medium",
          isVisible && !prefersReducedMotion && "quest-animate-fade-up quest-delay-3"
        )}
        style={{ color: 'var(--quest-text-secondary)' }}
      >
        Top 100 Courses Played
      </p>

      {/* Authority subtext */}
      <p
        className={cn(
          "text-xs mt-1",
          isVisible && !prefersReducedMotion && "quest-animate-fade-up quest-delay-4"
        )}
        style={{ color: 'var(--quest-text-tertiary)' }}
      >
        Ranked by Clbhouz
      </p>

      {seasonLabel && (
        <p
          className={cn(
            "text-xs mt-2",
            isVisible && !prefersReducedMotion && "quest-animate-fade-up quest-delay-5"
          )}
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          {seasonLabel}
        </p>
      )}
    </section>
  );
};

export default QuestHero;
