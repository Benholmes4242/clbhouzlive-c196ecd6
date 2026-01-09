/**
 * UpcomingTab - Shows upcoming games with "Next Up" hero card
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
    <div className="space-y-4">
      {/* Next Up section */}
      {nextUp && (
        <div>
          <h4 
            className="text-[11px] font-medium uppercase tracking-wide mb-2 px-1"
            style={{ color: 'rgba(30, 41, 59, 0.4)' }}
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
            className="text-[11px] font-medium uppercase tracking-wide mb-2 px-1"
            style={{ color: 'rgba(30, 41, 59, 0.4)' }}
          >
            Upcoming
          </h4>
          <div className="space-y-1.5">
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
                    onKebabTap={() => {
                      // TODO: Open action menu
                      console.log('Kebab tapped for game:', game.id);
                    }}
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
