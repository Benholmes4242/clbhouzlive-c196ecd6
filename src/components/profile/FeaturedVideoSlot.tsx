import React, { useState } from 'react';
import { Video, Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
 * 
 * Allows creators to feature a video at the top of their profile.
 * Shows empty state with CTA for owners, hidden for non-owners if no video.
 * Supports change, remove, and play actions.
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

  // If no video and not owner, don't show the slot
  if (!videoUrl && !isOwner) {
    return null;
  }

  // Empty state for owners
  if (!videoUrl && isOwner) {
    return (
      <div 
        className={className}
        style={{ 
          border: '1px dashed rgba(31,36,40,0.15)',
          borderRadius: '18px',
        }}
      >
        <button
          onClick={onEditClick}
          className="w-full py-8 flex flex-col items-center gap-3 hover:bg-muted/50 transition-colors rounded-sq-lg bg-card"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-muted">
            <Video className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Feature a video</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pin your best content to the top of your profile
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-1 rounded-full"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add video
          </Button>
        </button>
      </div>
    );
  }

  // Video display
  return (
    <>
      <div 
        className={`bg-card border border-border rounded-[18px] overflow-hidden ${className ?? ''}`}
      >
        {/* Header */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-[#F7931E]" />
            <span className="text-xs font-medium text-muted-foreground">Featured</span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-3">
              <button
                onClick={onEditClick}
                className="text-xs text-[#F7931E] font-medium hover:underline"
              >
                Change
              </button>
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="text-xs text-muted-foreground font-medium hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Video thumbnail — tappable for playback */}
        <button
          onClick={onPlayClick}
          className="relative w-full aspect-video bg-[#0A0A0A] block"
        >
          {posterUrl ? (
            <img 
              src={posterUrl} 
              alt="Featured video" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.onerror = null;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-12 w-12 text-white/30" />
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.9)' }}
            >
              <Play className="h-6 w-6 text-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        </button>
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove featured video?</AlertDialogTitle>
            <AlertDialogDescription>
              Your featured video will be removed from your profile. You can add a new one at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onRemoveClick?.();
                setShowRemoveConfirm(false);
              }}
              className="bg-red-500 hover:bg-red-600"
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
