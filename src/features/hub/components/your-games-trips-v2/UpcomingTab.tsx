/**
 * UpcomingTab - Shows upcoming games with "Next Up" hero card
 * V2: Premium section labels, better vertical spacing
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameCard } from './GameCard';
import { EmptyState } from './EmptyState';
import { SkeletonList } from './SkeletonLoader';
import { useUserUpcomingGames, type UserGame } from '../../hooks/useUserGamesTrips';

interface UpcomingTabProps {
  searchQuery: string;
  onCreateGame: () => void;
  onGameTap: (gameId: string) => void;
}

export function UpcomingTab({ searchQuery, onCreateGame, onGameTap }: UpcomingTabProps) {
  const { data: games, isLoading } = useUserUpcomingGames();

  // Filter by search
  const filtered = React.useMemo(() => {
    if (!games) return [];
    if (!searchQuery.trim()) return games;
    
    const q = searchQuery.toLowerCase();
    return games.filter(g => 
      g.courseName.toLowerCase().includes(q)
    );
  }, [games, searchQuery]);

  const nextUp = filtered[0];
  const upcomingList = filtered.slice(1);

  const handleGameTap = (game: UserGame) => {
    onGameTap(game.id);
  };

  if (isLoading) {
    return <SkeletonList includeHero />;
  }

  if (filtered.length === 0) {
    return <EmptyState tab="upcoming" onCreateGame={onCreateGame} />;
  }

  return (
    <div className="space-y-5">
      {/* Next Up section */}
      {nextUp && (
        <div>
          <h4 
            className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3 px-0.5"
            style={{ color: 'rgba(100, 116, 139, 0.55)' }}
          >
            Next Up
          </h4>
          <GameCard
            game={nextUp}
            variant="hero"
            onTap={() => handleGameTap(nextUp)}
          />
        </div>
      )}

      {/* Upcoming list */}
      {upcomingList.length > 0 && (
        <div>
          <h4 
            className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3 px-0.5"
            style={{ color: 'rgba(100, 116, 139, 0.55)' }}
          >
            Upcoming
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {upcomingList.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <GameCard
                    game={game}
                    variant="row"
                    onTap={() => handleGameTap(game)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
