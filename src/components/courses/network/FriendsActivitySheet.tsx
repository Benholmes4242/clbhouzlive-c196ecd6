import React from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import FriendsCoursesPanel from '@/components/courses/FriendsCoursesPanel';
import FriendsCoursesSignedOutEmpty from '@/components/courses/FriendsCoursesSignedOutEmpty';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface FriendsActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FriendsActivitySheet: React.FC<FriendsActivitySheetProps> = ({ open, onOpenChange }) => {
  const { user } = useSupabaseSession();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="h-[88dvh] rounded-t-[20px] border-border bg-background p-0"
      >
        <SheetTitle className="sr-only">Friends Activity</SheetTitle>
        <div className="flex justify-center px-4 pb-1 pt-2">
          <div className="h-1 w-9 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {user ? <FriendsCoursesPanel /> : <FriendsCoursesSignedOutEmpty />}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FriendsActivitySheet;