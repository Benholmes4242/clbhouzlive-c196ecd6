/**
 * AchievementConfetti - Controlled celebration confetti
 * 
 * Extremely controlled confetti that feels rewarding, not childish:
 * - Duration: 600-800ms
 * - Quantity: 12-18 particles
 * - Size: Tiny
 * - Gravity: Soft
 * - Fades out quickly
 * - Colors match achievement
 * - Emits from behind icon disc, fans outward in gentle arc
 * - Never full-screen
 */

import { useEffect, useCallback, useRef } from 'react';
import Confetti from 'react-confetti';

export type ConfettiTheme = 'gold' | 'green' | 'red' | 'blue' | 'champagne';

interface AchievementConfettiProps {
  isActive: boolean;
  theme: ConfettiTheme;
  onComplete?: () => void;
}

const THEME_COLORS: Record<ConfettiTheme, string[]> = {
  gold: ['#C9A961', '#E8D5A3', '#B8935A', '#D4BC7D'], // Worldwide
  green: ['#1B4D2E', '#2E7D4A', '#3D9A5D', '#4CAF6E'], // GB&I
  red: ['#8B3A3A', '#A85454', '#C76666', '#D48888'], // USA
  blue: ['#5B6B7C', '#7A8A9B', '#93A3B4', '#ACB9C6'], // Europe
  champagne: ['#D4C4A8', '#E8DCC8', '#C9B896', '#F0E6D4'], // Milestones
};

export function AchievementConfetti({ isActive, theme, onComplete }: AchievementConfettiProps) {
  const hasCompleted = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  const handleComplete = useCallback(() => {
    if (!hasCompleted.current) {
      hasCompleted.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (isActive) {
      hasCompleted.current = false;
      startTimeRef.current = Date.now();
      
      // Complete after duration
      const timer = setTimeout(() => {
        handleComplete();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, handleComplete]);

  if (!isActive) return null;

  const colors = THEME_COLORS[theme];

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]" style={{ overflow: 'hidden' }}>
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={16}
        recycle={false}
        run={isActive}
        gravity={0.15}
        initialVelocityX={{ min: -4, max: 4 }}
        initialVelocityY={{ min: -8, max: -2 }}
        confettiSource={{
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.35, // Behind the icon disc area
          w: 60,
          h: 10,
        }}
        colors={colors}
        opacity={0.9}
        tweenDuration={600}
        drawShape={(ctx) => {
          // Tiny particles - mix of circles and small rectangles
          const shapeType = Math.random();
          ctx.beginPath();
          if (shapeType < 0.5) {
            // Small circle
            ctx.arc(0, 0, 3, 0, 2 * Math.PI);
          } else {
            // Small rectangle
            ctx.fillRect(-2, -3, 4, 6);
          }
          ctx.fill();
        }}
        onConfettiComplete={handleComplete}
      />
    </div>
  );
}

export function getConfettiTheme(
  type: 'milestone' | 'regional',
  regionSlug?: string
): ConfettiTheme {
  if (type === 'milestone') {
    return 'champagne';
  }
  
  switch (regionSlug) {
    case 'global':
      return 'gold';
    case 'gb-i':
      return 'green';
    case 'usa':
      return 'red';
    case 'europe':
      return 'blue';
    default:
      return 'champagne';
  }
}
