import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}

export const RemoveLastConfirmation: React.FC<Props> = ({
  open,
  onCancel,
  onConfirm,
  busy,
}) => (
  <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Remove your last pinned rival?</AlertDialogTitle>
        <AlertDialogDescription>
          Your rivals will be auto-picked from your most-played friends until you pin someone new.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel} disabled={busy}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={busy}>
          Remove
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default RemoveLastConfirmation;
