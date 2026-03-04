/**
 * FullscreenOverlay - UI overlay layer reusing Clubhouse cinematic components
 * 
 * Uses CreatorCapsule and CinematicActionRail from Clubhouse for visual parity.
 * Carousel dots are passed via CreatorCapsule's dotsSlot prop.
 * 
 * Wires live engagement hooks (like, follow, share, bookmark) so all entry
 * points get working interactions without the caller needing to pass callbacks.
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { useNavigate } from 'react-router-dom';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';

import { useAudioFade } from '@/hooks/useAudioFade';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { useFollow } from '@/hooks/useFollow';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { toast } from 'sonner';
import { Trash2, Flag } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export interface FullscreenOverlayProps {
  showComments?: boolean;
  showShare?: boolean;
  showActionRail?: boolean;
  showCreatorCapsule?: boolean;
  /** Parent-level callbacks (used as fallbacks if provided) */
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onFollow?: () => void;
  className?: string;
}


export const FullscreenOverlay: React.FC<FullscreenOverlayProps> = ({
  showComments = true,
  showShare = true,
  showActionRail = true,
  showCreatorCapsule = true,
  onLike: parentOnLike,
  onComment: parentOnComment,
  onShare: parentOnShare,
  onFollow: parentOnFollow,
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { deletePost } = usePostDeletion();
  
  const { fadeIn, fadeOut } = useAudioFade({ duration: 150, easing: 'easeOut' });
  const item = viewer.currentItem;

  // ─── Delete confirmation state ───
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Live engagement hook ───
  const postId = item?.postId || item?.id || null;
  const {
    likesCount,
    commentsCount,
    hasLiked,
    toggleLike,
  } = usePostEngagement(postId);

  // ─── Live follow hook ───
  const creatorId = item?.creatorId;
  const isOwnPost = !!(user?.id && creatorId && user.id === creatorId);
  const {
    isFollowing: followState,
    toggle: toggleFollow,
    ensureInitial: ensureFollowInitial,
  } = useFollow(isOwnPost ? undefined : creatorId);

  // Fetch initial follow state when creator changes
  useEffect(() => {
    if (creatorId && !isOwnPost) {
      ensureFollowInitial();
    }
  }, [creatorId, isOwnPost, ensureFollowInitial]);

  const isFollowing = followState === 'following';

  // Mute toggle with audio fade
  const handleMuteToggle = useCallback(async () => {
    const video = viewer.activeVideoRef?.current;
    if (!video) {
      viewer.toggleMute();
      return;
    }
    if (viewer.isMuted) {
      viewer.setMuted(false);
      await fadeIn(video, 1);
    } else {
      await fadeOut(video);
      viewer.setMuted(true);
    }
  }, [viewer, fadeIn, fadeOut]);

  // ─── Action handlers ───

  const handleLike = useCallback(() => {
    toggleLike();
    parentOnLike?.();
  }, [toggleLike, parentOnLike]);

  const handleComment = useCallback(() => {
    viewer.setCommentsOpen(true);
    parentOnComment?.();
  }, [viewer, parentOnComment]);

  const handleShare = useCallback(async () => {
    const sharePostId = item?.postId || item?.id;
    if (!sharePostId) return;
    
    const shareUrl = `${window.location.origin}/clubhouse/post/${sharePostId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.creatorName || 'Post',
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Copied to clipboard');
    }
    parentOnShare?.();
  }, [item, parentOnShare]);

  const handleFollow = useCallback(() => {
    toggleFollow();
    parentOnFollow?.();
  }, [toggleFollow, parentOnFollow]);

  const handleMore = useCallback(() => {
    if (isOwnPost) {
      setShowDeleteConfirm(true);
    } else {
      toast('Report & moderation coming soon');
    }
  }, [isOwnPost]);

  const handleConfirmDelete = useCallback(async () => {
    if (isDeleting || !postId) return;
    setIsDeleting(true);
    try {
      const result = await deletePost(postId);
      if (result.success) {
        setShowDeleteConfirm(false);
        viewer.close();
      }
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, postId, deletePost, viewer]);

  // Navigate to creator profile
  const handleViewProfile = useCallback(() => {
    if (item?.creatorId && item.creatorId !== 'unknown') {
      viewer.close();
      setTimeout(() => navigate(`/profile/${item.creatorId}`), 100);
    }
  }, [item, viewer, navigate]);

  // Navigate to course
  const handleCourseTap = useCallback(() => {
    if (item?.courseId) {
      viewer.close();
      setTimeout(() => navigate(`/courses/${item.courseId}`), 100);
    }
  }, [item, viewer, navigate]);

  // Carousel dots for multi-media posts
  // Elongated carousel dots matching Clubhouse feed style
  const dotsSlot = useMemo(() => {
    if (viewer.totalMediaInPost <= 1) return undefined;
    return (
      <div className="flex items-center gap-2" role="tablist" aria-label="Media pagination">
        {Array.from({ length: viewer.totalMediaInPost }).map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === viewer.currentMediaIndex}
            aria-label={`Go to media ${i + 1}`}
            onClick={() => viewer.goToMedia(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ease-out ${
              i === viewer.currentMediaIndex
                ? 'w-5 bg-white/50'
                : 'w-1.5 bg-white/25'
            }`}
          />
        ))}
      </div>
    );
  }, [viewer.totalMediaInPost, viewer.currentMediaIndex, viewer.goToMedia]);

  // Build golf course info for capsule
  const golfCourse = useMemo(() => {
    if (!item?.courseName) return undefined;
    return {
      id: item.courseId || null,
      name: item.courseName || null,
      country: item.courseCountry || null,
      region: item.courseRegion || null,
    };
  }, [item?.courseId, item?.courseName, item?.courseCountry, item?.courseRegion]);

  if (!item) return null;

  return (
    <div className={cn('absolute inset-0 pointer-events-none z-20', className)}>
      {/* CinematicActionRail (right side) — reuses Clubhouse component */}
      {showActionRail && (
        <div 
          className="pointer-events-auto"
          style={{ 
            position: 'fixed',
            right: 0,
            bottom: 0,
            zIndex: 40,
          }}
        >
          <CinematicActionRail
            postId={postId || item.id}
            likesCount={likesCount}
            commentsCount={commentsCount}
            hasLiked={hasLiked}
            isMuted={viewer.isMuted}
            isVisible={true}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onMuteToggle={handleMuteToggle}
            onMore={handleMore}
            hasInteracted={true}
            bottomOffset="calc(env(safe-area-inset-bottom, 0px) + 48px - 20px)"
          />
        </div>
      )}

      {/* CreatorCapsule (bottom left) — reuses Clubhouse component */}
      {showCreatorCapsule && (
        <div className="pointer-events-auto">
          <CreatorCapsule
            user={{
              id: item.creatorId || 'unknown',
              name: item.creatorName || 'Golfer',
              username: item.creatorUsername,
              avatar: item.creatorAvatar,
            }}
            caption={item.caption}
            golfCourse={golfCourse}
            isFollowing={isFollowing}
            isOwnPost={isOwnPost}
            isVisible={true}
            onFollow={handleFollow}
            onViewProfile={handleViewProfile}
            isReview={item.isReview}
            reviewData={item.reviewData}
            onReviewTap={handleCourseTap}
            dotsSlot={dotsSlot}
            bottomOffset="calc(env(safe-area-inset-bottom, 0px) + 48px)"
          />
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="z-[10003] pointer-events-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your post and all its media will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FullscreenOverlay;
