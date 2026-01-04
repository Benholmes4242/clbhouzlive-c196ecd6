import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedNumber, AnimatedProgressBar } from '@/components/ui/motion';

interface Top100Progress {
  listId: string;
  listName: string;
  played: number;
  total: number;
}

interface GolfJourneyCardProps {
  coursesPlayed: number;
  countries: string[];
  top100Progress: Top100Progress[];
  isOwnProfile?: boolean;
  className?: string;
}

const GolfJourneyCard: React.FC<GolfJourneyCardProps> = ({
  coursesPlayed,
  countries,
  top100Progress,
  isOwnProfile = true,
  className
}) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: 0.05 }}
      className={cn(
        'rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5',
        'shadow-sm',
        className
      )}
    >
      <h3 className="text-base font-semibold text-foreground mb-5">
        {isOwnProfile ? 'Your Golf Journey' : 'Golf Journey'}
      </h3>

      {/* 1. Courses Played - Primary KPI */}
      <div className="mb-6">
        <AnimatedNumber 
          value={coursesPlayed}
          className="text-4xl font-bold text-foreground"
          minCh={1}
        />
        <p className="text-sm text-muted-foreground mt-1">Courses played</p>
      </div>

      {/* 2. Countries */}
      {countries.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Countries</p>
          <div className="flex flex-wrap gap-2">
            {countries.map(country => (
              <motion.span
                key={country}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full',
                  'bg-muted/50 text-foreground/90',
                  'border border-border/30'
                )}
              >
                {country}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Top 100 Progress - with animated bars */}
      {top100Progress.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Top 100 Progress</p>
          <div className="space-y-3">
            {top100Progress.map((list, index) => {
              const percentage = (list.played / list.total) * 100;
              return (
                <div key={list.listId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground/90">{list.listName}</span>
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      <AnimatedNumber value={list.played} minCh={1} delay={index * 0.05} />
                      <span className="text-muted-foreground"> / {list.total}</span>
                    </span>
                  </div>
                  <AnimatedProgressBar 
                    percentage={percentage}
                    delay={0.1 + index * 0.05}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GolfJourneyCard;
