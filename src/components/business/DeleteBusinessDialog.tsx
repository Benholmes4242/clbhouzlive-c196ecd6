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
import { useDeleteBusiness } from '@/hooks/useDeleteBusiness';

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

  const handleDelete = () => {
    deleteBusiness({ businessId, userId });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-sq-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this business profile?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>This will:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Remove <strong>{businessName}</strong> from search and discovery</li>
              <li>Hide its posts, followers and insights from golfers</li>
            </ul>
            <p className="text-muted-foreground">
              You won't be able to undo this right now.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete business profile'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
