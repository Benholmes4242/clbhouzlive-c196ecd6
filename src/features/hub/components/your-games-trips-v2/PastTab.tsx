/**
 * PastTab - Shows past/completed games
 * V2: Red trash icon to remove with confirm dialog
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { GameCard } from './GameCard';
import { EmptyState } from './EmptyState';
import { SkeletonList } from './SkeletonLoader';
import { useUserPastGames, type UserGame } from '../../hooks/useUserGamesTrips';
import { useArchivePastGame } from '../../hooks/useArchivePastGame';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface PastTabProps {
  searchQuery: string;
  onGameTap: (gameId: string) => void;
}

export function PastTab({ searchQuery, onGameTap }: PastTabProps) {
  const { data: games, isLoading } = useUserPastGames();
  const { archiveGame, isPending } = useArchivePastGame();
  const [gameToRemove, setGameToRemove] = useState<UserGame | null>(null);

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

  const handleRemoveConfirm = () => {
    if (gameToRemove) {
      archiveGame(gameToRemove.id);
      setGameToRemove(null);
      toast.success('Removed');
    }
  };

  if (isLoading) {
    return <SkeletonList />;
  }

  if (filtered.length === 0) {
    return <EmptyState tab="past" />;
  }

  return (
    <>
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.03 }}
              className="relative"
            >
              <GameCard
                game={game}
                variant="row"
                onTap={() => handleGameTap(game)}
              />
              {/* Red trash icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGameToRemove(game);
                }}
                disabled={isPending}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-red-50 transition-colors"
                aria-label="Remove from past games"
              >
                <Trash2 
                  className="w-4 h-4"
                  style={{ color: 'rgba(220, 38, 38, 0.7)' }}
                />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!gameToRemove} onOpenChange={() => setGameToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove it from your list. Other players won't be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
