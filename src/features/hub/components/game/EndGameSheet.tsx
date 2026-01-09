/**
 * EndGameSheet - Bottom sheet for ending a game
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEndGame } from '../../hooks/useEndGame';
import { toast } from 'sonner';

interface EndGameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  onSuccess?: () => void;
}

export function EndGameSheet({ isOpen, onClose, gameId, onSuccess }: EndGameSheetProps) {
  const endGameMutation = useEndGame();

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleEndGame = async () => {
    try {
      await endGameMutation.mutateAsync(gameId);
      toast.success('Game ended');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to end game');
    }
  };

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999]"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-[10000] rounded-t-[20px] overflow-hidden"
            style={{
              backgroundColor: 'hsl(var(--background))',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.12)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  End Game?
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground">
                This will close RSVPs and mark the game as completed. 
                Players will no longer be able to change their status.
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEndGame}
                disabled={endGameMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {endGameMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                End Game
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
