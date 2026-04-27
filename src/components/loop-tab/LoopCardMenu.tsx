import React from 'react';
import { MoreHorizontal, Bookmark, Link2, Share2, EyeOff, Flag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LoopCardMenuProps {
  postId: string;
  userId?: string;
  onShare: () => void;
  isOwnPost?: boolean;
  onDelete?: () => void;
}

export const LoopCardMenu = React.memo(function LoopCardMenu({
  postId,
  userId,
  onShare,
  isOwnPost = false,
  onDelete,
}: LoopCardMenuProps) {
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const handleNotInterested = async () => {
    if (!userId) return;
    const { error } = await supabase.from('post_dismissals').insert({
      post_id: postId,
      user_id: userId,
    });
    if (error) {
      if (import.meta.env.DEV) console.error('[LoopCardMenu] Dismiss failed:', error);
    } else {
      toast.success("We'll show you less like this");
    }
  };

  const handleReport = async () => {
    if (!userId) return;
    const { error } = await supabase.from('post_reports').insert({
      post_id: postId,
      reporter_id: userId,
    });
    if (error) {
      if (import.meta.env.DEV) console.error('[LoopCardMenu] Report failed:', error);
    } else {
      toast.success('Report submitted');
    }
  };

  const handleSave = () => {
    toast.success('Saved');
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm('Delete this post?')) onDelete();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-3 -mr-3 rounded-full hover:bg-muted transition-colors"
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleSave} className="gap-2 text-sm">
          <Bookmark className="h-4 w-4" />
          Save
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2 text-sm">
          <Link2 className="h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShare} className="gap-2 text-sm">
          <Share2 className="h-4 w-4" />
          Share
        </DropdownMenuItem>
        {isOwnPost && onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="gap-2 text-sm text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={handleNotInterested} className="gap-2 text-sm">
              <EyeOff className="h-4 w-4" />
              Not Interested
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleReport}
              className="gap-2 text-sm text-destructive focus:text-destructive"
            >
              <Flag className="h-4 w-4" />
              Report
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
