/**
 * CancelTripDialog - Confirmation dialog for cancelling a trip
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
import { useCancelTrip } from '@/features/hub/hooks/useCancelTrip';

interface CancelTripDialogProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  participantCount: number;
  onSuccess?: () => void;
}

export function CancelTripDialog({
  open,
  onClose,
  tripId,
  tripName,
  participantCount,
  onSuccess,
}: CancelTripDialogProps) {
  const [reason, setReason] = useState('');
  const { mutate: cancelTrip, isPending } = useCancelTrip();

  const handleCancel = () => {
    cancelTrip(
      { tripId, reason: reason.trim() || undefined },
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
          <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel <strong>{tripName}</strong> and all associated rounds.
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
            placeholder="Let players know why the trip is cancelled..."
            className="resize-none"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep Trip</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? 'Cancelling...' : 'Cancel Trip'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
