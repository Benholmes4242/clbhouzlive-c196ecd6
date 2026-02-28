/**
 * PostActionBar - Global canonical action bar for posts
 * Single source of truth for action icons and labels across all surfaces
 * 
 * Canonical icons (matching Business Activity):
 * - Like: Heart (lucide)
 * - Comment: MessageSquare (lucide, rounded-square bubble)
 * - Reshare: Repeat2 (lucide, circular arrows)
 * - Send: Send (lucide, paper plane)
 */

import React, { useCallback } from 'react';
import { Heart, MessageSquare, Repeat2, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { toast } from 'sonner';

export interface PostActionBarProps {
  postId: string;
  /** Optional variant for compact mode */
  variant?: 'default' | 'compact';
  /** Callback when comments should open */
  onOpenComments?: () => void;
  /** Optional class name */
  className?: string;
  /** Optional share title for native share */
  shareTitle?: string;
}

// Minimum touch target height per accessibility guidelines
const MIN_TOUCH_TARGET = 44;

/**
 * PostActionBar - Canonical action bar for all post surfaces
 * Uses shared usePostEngagement hook for single source of truth
 */
export function PostActionBar({
  postId,
  variant = 'default',
  onOpenComments,
  className,
  shareTitle,
}: PostActionBarProps) {
  const { hasLiked, toggleLike, isTogglingLike } = usePostEngagement(postId);

  const handleLike = useCallback(() => {
    toggleLike();
  }, [toggleLike]);

  const handleComment = useCallback(() => {
    onOpenComments?.();
  }, [onOpenComments]);

  const handleReshare = useCallback(() => {
    toast.info('Reshare coming soon');
  }, []);

  const handleSend = useCallback(async () => {
    // Use canonical post deep link path
    const url = `${window.location.origin}/clubhouse/post/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle || 'Post', url });
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Copied to clipboard');
    }
  }, [postId, shareTitle]);

  const isCompact = variant === 'compact';

  return (
    <div className={cn('py-1 flex items-center border-t border-border/30', className)}>
      <ActionButton
        icon={Heart}
        label="Like"
        isActive={hasLiked}
        isLoading={isTogglingLike}
        onClick={handleLike}
        compact={isCompact}
      />
      <ActionButton
        icon={MessageSquare}
        label="Comment"
        onClick={handleComment}
        compact={isCompact}
      />
      <ActionButton
        icon={Repeat2}
        label="Reshare"
        onClick={handleReshare}
        compact={isCompact}
      />
      <ActionButton
        icon={Send}
        label="Send"
        onClick={handleSend}
        compact={isCompact}
      />
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

function ActionButton({ 
  icon: Icon, 
  label, 
  isActive, 
  isLoading, 
  onClick,
  compact = false,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      aria-label={label}
      style={{ minHeight: MIN_TOUCH_TARGET }}
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors hover:bg-muted/50 disabled:opacity-50',
        compact ? 'py-1.5 px-1' : 'py-2 px-2',
        isActive ? 'text-[#F7931E]' : 'text-muted-foreground'
      )}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin', compact ? 'h-4 w-4' : 'h-5 w-5')} />
      ) : (
        <Icon 
          className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} 
          fill={isActive ? 'currentColor' : 'none'} 
        />
      )}
      <span className={cn('font-medium', compact ? 'text-[10px]' : 'text-xs')}>
        {label}
      </span>
    </button>
  );
}

export default PostActionBar;
