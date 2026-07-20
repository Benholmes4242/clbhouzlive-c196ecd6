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
          <AlertDialogTitle>Delete business profile?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove your business from Clbhouz. This action can{"'"}t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete business'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
