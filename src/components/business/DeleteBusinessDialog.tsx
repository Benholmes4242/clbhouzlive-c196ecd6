import {
import { TITLE } from '@/lib/tokens/type';
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteBusiness } from '@/hooks/useDeleteBusiness';
import { useState } from 'react';

interface DeleteBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  userId: string;
}

export function DeleteBusinessDialog({
  open,
  onOpenChange,
  businessId,
  businessName,
  userId,
}: DeleteBusinessDialogProps) {
  const { mutate: deleteBusiness, isPending } = useDeleteBusiness();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting || isPending) return;
    // Close FIRST so Radix runs its exit cycle before invalidations evict
    // this card (and unmount the dialog host). Otherwise pointer-events:none
    // leaks onto <body> and freezes the app.
    setIsDeleting(true);
    onOpenChange(false);
    await new Promise((r) => setTimeout(r, 300));
    deleteBusiness({ businessId, userId });
    // No need to reset isDeleting — host will unmount on success; on failure
    // the hook surfaces its own toast and the card remains for retry.
  };

  const busy = isPending || isDeleting;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-sq-lg">
        <AlertDialogHeader>
          <AlertDialogTitle style={TITLE}>Delete business profile?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove {businessName} from Clbhouz. This action can{"'"}t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete business
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
