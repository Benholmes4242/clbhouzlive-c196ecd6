import React, { useState } from 'react';
import { Pin, X } from 'lucide-react';
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

interface PinnedPost {
  id: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
}

interface PinnedPostsSectionProps {
  posts: PinnedPost[];
  isOwner: boolean;
  onPostClick?: (postId: string) => void;
  onUnpinClick?: (postId: string) => void;
  className?: string;
}

/**
 * Phase 3.2B: Pinned Posts Section for Creators
 */
export function PinnedPostsSection({ 
  posts, 
  isOwner, 
  onPostClick,
  onUnpinClick,
  className 
}: PinnedPostsSectionProps) {
  const [unpinConfirmId, setUnpinConfirmId] = useState<string | null>(null);

  if (!posts || posts.length === 0) return null;

  const handleUnpinConfirm = () => {
    if (unpinConfirmId && onUnpinClick) {
      onUnpinClick(unpinConfirmId);
    }
    setUnpinConfirmId(null);
  };

  return (
    <>
      <div className={className}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Pin className="h-3.5 w-3.5 text-[#C1A84C]" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pinned
          </span>
        </div>

        {/* Pinned posts row */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {posts.slice(0, 3).map((post) => (
            <div key={post.id} className="relative flex-shrink-0">
              <button
                onClick={() => onPostClick?.(post.id)}
                className="block w-24 h-24 rounded-xl overflow-hidden bg-muted active:opacity-90 transition-opacity border border-border"
              >
                {post.thumbnailUrl ? (
                  <img 
                    src={post.thumbnailUrl} 
                    alt="Pinned post" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Pin className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                
                {/* Pinned indicator */}
                <span className="absolute bottom-1 left-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#C1A84C]/90">
                  <Pin className="h-2.5 w-2.5 text-white" />
                </span>
              </button>

              {/* Unpin button — always visible for owners */}
              {isOwner && onUnpinClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUnpinConfirmId(post.id);
                  }}
                  className="absolute top-1 right-1 w-7 h-7 min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center active:scale-[0.85] transition-transform"
                  title="Unpin"
                >
                  <span className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-white" />
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unpin confirmation dialog */}
      <AlertDialog open={!!unpinConfirmId} onOpenChange={(open) => !open && setUnpinConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-bold text-lg">Unpin this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This post will no longer appear in your pinned section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-border text-foreground min-h-[48px] rounded-full active:scale-[0.97] transition-transform">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnpinConfirm}
              className="bg-foreground text-background hover:bg-foreground/90 min-h-[48px] rounded-full active:scale-[0.97] transition-transform"
            >
              Unpin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PinnedPostsSection;
