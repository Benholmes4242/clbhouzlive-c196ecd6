import React, { useState } from 'react';
import { Video, Play, Plus } from 'lucide-react';
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

interface FeaturedVideoSlotProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  isOwner: boolean;
  onEditClick?: () => void;
  onRemoveClick?: () => void;
  onPlayClick?: () => void;
  className?: string;
}

/**
 * Phase 3.2: Featured Video Slot for Creators
 */
export function FeaturedVideoSlot({ 
  videoUrl, 
  posterUrl, 
  isOwner, 
  onEditClick,
  onRemoveClick,
  onPlayClick,
  className 
}: FeaturedVideoSlotProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  if (!videoUrl && !isOwner) return null;

  // Empty state for owners
  if (!videoUrl && isOwner) {
    return (
      <div className={`border border-border rounded-xl bg-card p-6 ${className ?? ''}`}>
        <button
          onClick={onEditClick}
          className="w-full flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#C1A84C]/10">
            <Video className="h-6 w-6 text-[#C1A84C]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Feature a video</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pin your best content to the top of your profile
            </p>
          </div>
          <span className="mt-1 inline-flex items-center gap-1.5 min-h-[44px] px-6 rounded-full text-sm font-medium bg-[#C1A84C]/10 border border-[#C1A84C]/30 text-[#C1A84C] active:scale-[0.95] transition-transform">
            <Plus className="h-4 w-4" />
            Add video
          </span>
        </button>
      </div>
    );
  }

  // Video display
  return (
    <>
      <div className={`bg-card border border-border rounded-xl overflow-hidden ${className ?? ''}`}>
        {/* Header */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-[#C1A84C]" />
            <span className="text-xs font-medium text-muted-foreground">Featured</span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-3">
              <button
                onClick={onEditClick}
                className="text-xs text-[#C1A84C] font-medium min-h-[44px] flex items-center"
              >
                Change
              </button>
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="text-xs text-muted-foreground font-medium min-h-[44px] flex items-center active:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Video thumbnail */}
        <button
          onClick={onPlayClick}
          className="relative w-full aspect-video bg-muted block"
        >
          {posterUrl ? (
            <img 
              src={posterUrl} 
              alt="Featured video" 
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.onerror = null;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Video className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-background/90 backdrop-blur-sm shadow-sm">
              <Play className="h-6 w-6 text-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        </button>
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-bold text-lg">Remove featured video?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Your featured video will be removed from your profile. You can add a new one at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-border text-foreground min-h-[48px] rounded-full active:scale-[0.97] transition-transform">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onRemoveClick?.();
                setShowRemoveConfirm(false);
              }}
              className="bg-foreground text-background hover:bg-foreground/90 min-h-[48px] rounded-full active:scale-[0.97] transition-transform"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default FeaturedVideoSlot;
