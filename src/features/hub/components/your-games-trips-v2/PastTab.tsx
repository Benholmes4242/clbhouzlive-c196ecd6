/**
 * PastTab - Shows past/completed games
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameCard } from './GameCard';
import { EmptyState } from './EmptyState';
import { SkeletonList } from './SkeletonLoader';
import { useUserPastGames, type UserGame } from '../../hooks/useUserGamesTrips';

interface PastTabProps {
  searchQuery: string;
  onGameTap: (gameId: string) => void;
}

export function PastTab({ searchQuery, onGameTap }: PastTabProps) {
  const { data: games, isLoading } = useUserPastGames();

  // Filter by search
  const filtered = React.useMemo(() => {
    if (!games) return [];
    if (!searchQuery.trim()) return games;
    
    const q = searchQuery.toLowerCase();
    return games.filter(g => 
      g.courseName.toLowerCase().includes(q)
    );
  }, [games, searchQuery]);

  const handleGameTap = (game: UserGame) => {
    onGameTap(game.id);
  };

  if (isLoading) {
    return <SkeletonList />;
  }

  if (filtered.length === 0) {
    return <EmptyState tab="past" />;
  }

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {filtered.map((game, index) => (
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
                // TODO: Open action menu with "Post recap" option
                console.log('Kebab tapped for past game:', game.id);
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
