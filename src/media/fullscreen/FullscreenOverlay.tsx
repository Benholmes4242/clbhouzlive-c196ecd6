/**
 * FullscreenOverlay - UI overlay layer reusing Clubhouse cinematic components
 * 
 * Uses CreatorCapsule and CinematicActionRail from Clubhouse for visual parity.
 * Carousel dots are passed via CreatorCapsule's dotsSlot prop.
 */

import React, { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { useNavigate } from 'react-router-dom';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import CarouselDots from '@/components/posts/CarouselDots';
import { useAudioFade } from '@/hooks/useAudioFade';

export interface FullscreenOverlayProps {
  showComments?: boolean;
  showShare?: boolean;
  showActionRail?: boolean;
  showCreatorCapsule?: boolean;
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
  onLike,
  onComment,
  onShare,
  onFollow,
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const navigate = useNavigate();
  
  const { fadeIn, fadeOut } = useAudioFade({ duration: 150, easing: 'easeOut' });
  const item = viewer.currentItem;

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
  const dotsSlot = useMemo(() => {
    if (viewer.totalMediaInPost <= 1) return undefined;
    return (
      <CarouselDots
        count={viewer.totalMediaInPost}
        activeIndex={viewer.currentMediaIndex}
        onDotClick={viewer.goToMedia}
      />
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
            postId={item.postId || item.id}
            likesCount={item.likeCount || 0}
            commentsCount={item.commentCount || 0}
            hasLiked={item.isLiked || false}
            isMuted={viewer.isMuted}
            isVisible={true}
            onLike={onLike || (() => {})}
            onComment={onComment || (() => {})}
            onShare={onShare || (() => {})}
            onMuteToggle={handleMuteToggle}
            onMore={() => {}}
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
            isFollowing={false}
            isOwnPost={false}
            isVisible={true}
            onFollow={onFollow}
            onViewProfile={handleViewProfile}
            isReview={item.isReview}
            reviewData={item.reviewData}
            onReviewTap={handleCourseTap}
            dotsSlot={dotsSlot}
            bottomOffset="calc(env(safe-area-inset-bottom, 0px) + 48px)"
          />
        </div>
      )}
    </div>
  );
};

export default FullscreenOverlay;
