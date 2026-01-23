import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface RankCelebrationProps {
  previousRank: number;
  currentRank: number;
  show: boolean;
  onComplete: () => void;
}

export const RankCelebration: React.FC<RankCelebrationProps> = ({
  previousRank,
  currentRank,
  show,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && currentRank < previousRank) {
      setVisible(true);
      
      // Trigger confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#F59E0B', '#3B82F6'],
      });

      // Hide after 2 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, currentRank, previousRank, onComplete]);

  if (!visible) return null;

  const positions = previousRank - currentRank; // Positive = improvement

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={cn(
        "bg-white rounded-sq-lg shadow-2xl p-8 text-center",
        "animate-bounce-in"
      )}>
        <div className="text-5xl mb-2">🎉</div>
        <h2 className="text-2xl font-bold text-primary">
          You moved up!
        </h2>
        <p className="text-lg text-muted-foreground">
          +{positions} position{positions > 1 ? 's' : ''}
        </p>
        <p className="text-3xl font-black text-primary mt-2">
          Now #{currentRank}
        </p>
      </div>
    </div>
  );
};
