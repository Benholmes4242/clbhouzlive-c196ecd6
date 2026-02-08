/**
 * RoundSelector - Segmented round filter with spring-animated indicator
 * Matches TournamentDetailTabs styling for visual consistency
 */

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RoundSelectorProps {
  rounds: string[];
  activeRound: string;
  onRoundChange: (round: string) => void;
  className?: string;
}

export function RoundSelector({ rounds, activeRound, onRoundChange, className }: RoundSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Calculate indicator position
  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = rounds.findIndex(r => r === activeRound);
    const buttons = containerRef.current.querySelectorAll('button');
    const activeButton = buttons[activeIndex] as HTMLButtonElement;

    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeRound, rounds]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex p-1 rounded-xl bg-muted/60 border border-border/50 overflow-hidden",
        className
      )}
    >
      {/* Spring-animated sliding indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-card shadow-sm border border-border/60"
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {rounds.map((round) => {
        const isActive = activeRound === round;
        return (
          <button
            key={round}
            onClick={() => onRoundChange(round)}
            className={cn(
              "relative z-10 flex-1 py-2.5 text-sm text-center rounded-lg transition-colors duration-200 active:scale-[0.95] transition-transform",
              isActive
                ? "font-semibold text-foreground"
                : "text-muted-foreground font-medium hover:text-foreground"
            )}
          >
            {round}
          </button>
        );
      })}
    </div>
  );
}
