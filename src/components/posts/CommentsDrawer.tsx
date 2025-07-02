import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  postId
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[70vh] rounded-t-lg border-0 shadow-2xl"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Comments</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-4">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto">
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to comment!</p>
            </div>
          </div>

          {/* Comment Input */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add a comment..."
                className="flex-1"
              />
              <Button size="icon" className="bg-[#6e9277] hover:bg-[#5a7a63]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsDrawer;