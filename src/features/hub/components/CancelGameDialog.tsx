/**
 * CancelGameDialog - Confirmation dialog for cancelling a game
 */

import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useCancelGame } from '@/features/hub/hooks/useCancelGame';

interface CancelGameDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  courseName: string;
  participantCount: number;
  onSuccess?: () => void;
}

export function CancelGameDialog({
  open,
  onClose,
  gameId,
  courseName,
  participantCount,
  onSuccess,
}: CancelGameDialogProps) {
  const [reason, setReason] = useState('');
  const { mutate: cancelGame, isPending } = useCancelGame();

  const handleCancel = () => {
    cancelGame(
      { gameId, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this game?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel the game at <strong>{courseName}</strong>.
            {participantCount > 1 && (
              <>
                {' '}
                All {participantCount - 1} participant{participantCount > 2 ? 's' : ''} will be
                notified.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Reason (optional)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let players know why the game is cancelled..."
            className="resize-none"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep Game</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? 'Cancelling...' : 'Cancel Game'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
