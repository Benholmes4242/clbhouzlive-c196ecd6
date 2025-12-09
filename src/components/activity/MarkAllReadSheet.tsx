import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MarkAllReadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const MarkAllReadSheet: React.FC<MarkAllReadSheetProps> = ({
  open,
  onOpenChange,
  unreadCount,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-sq-lg px-5 pb-8 pt-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-semibold">Mark all as read?</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            This will clear all unread activity.
          </SheetDescription>
        </SheetHeader>
        
        <SheetFooter className="mt-6 flex-col gap-2 sm:flex-col">
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="w-full rounded-sq-sm"
          >
            {isLoading ? 'Marking...' : `Mark all as read (${unreadCount})`}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full rounded-sq-sm"
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
