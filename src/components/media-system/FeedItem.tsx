/**
 * FeedItem — one full-screen item in the vertical feed.
 * Renders MediaCarousel for multi-media, single VideoPlayer/ImageViewer for single.
 * Includes CreatorCapsule, SocialOverlay, ReviewBanner, and EndOfFeed overlay.
 * Wires like/follow mutations with optimistic UI.
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ImageViewer } from './ImageViewer';
import { MediaCarousel } from './MediaCarousel';
import { SocialOverlay } from './SocialOverlay';
import { CreatorCapsule } from './CreatorCapsule';
import { ReviewBanner } from './ReviewBanner';
import { EndOfFeed } from './EndOfFeed';
import { useLikeMutation } from './hooks/useLikeMutation';
import { useFollowMutation } from './hooks/useFollowMutation';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import type { FeedPost } from './types/media';

interface FeedItemProps {
  post: FeedPost;
  index: number;
  isActive: boolean;
  isLastItem?: boolean;
  hasNextPage?: boolean;
  followOverride?: boolean;
  onFollowChange?: (userId: string, isFollowed: boolean) => void;
}

export function FeedItem({
  post, index, isActive, isLastItem = false, hasNextPage = true,
  followOverride, onFollowChange,
}: FeedItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useSupabaseSession();
  const navigate = useNavigate();

  // ── Like state (optimistic) ──
  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount);
  const likeMutation = useLikeMutation();

  useEffect(() => {
    setIsLiked(post.isLikedByMe);
    setLocalLikeCount(post.likeCount);
  }, [post.id, post.isLikedByMe, post.likeCount]);

  // ── Follow state (optimistic, with cross-post override) ──
  const [localFollowed, setLocalFollowed] = useState(post.isFollowedByMe);
  const followMutation = useFollowMutation();

  useEffect(() => {
    setLocalFollowed(post.isFollowedByMe);
  }, [post.id, post.isFollowedByMe]);

  const isFollowed = followOverride ?? localFollowed;

  // ── Scrubbing state ──
  const [isScrubbing, setIsScrubbing] = useState(false);
  const handleScrubStart = useCallback(() => setIsScrubbing(true), []);
  const handleScrubEnd = useCallback(() => setIsScrubbing(false), []);

  // ── Like handler ──
  const handleLike = useCallback(() => {
    if (!user?.id) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLocalLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    likeMutation.mutate(
      {
        postId: post.id,
        userId: user.id,
        actorId: user.id,
        actorType: 'personal',
        isLiked: wasLiked,
      },
      {
        onError: () => {
          setIsLiked(wasLiked);
          setLocalLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
        },
      }
    );
  }, [isLiked, post.id, user?.id, likeMutation]);

  // ── Follow handler ──
  const handleFollow = useCallback(() => {
    if (!user?.id) return;
    const wasFollowed = isFollowed;
    setLocalFollowed(!wasFollowed);
    onFollowChange?.(post.userId, !wasFollowed);

    followMutation.mutate(
      {
        targetUserId: post.userId,
        targetActorType: post.actorType,
        targetActorId: post.actorId,
        currentUserId: user.id,
        isFollowed: wasFollowed,
      },
      {
        onError: () => {
          setLocalFollowed(wasFollowed);
          onFollowChange?.(post.userId, wasFollowed);
        },
      }
    );
  }, [isFollowed, post.userId, post.actorType, post.actorId, user?.id, followMutation, onFollowChange]);

  // ── Profile navigation ──
  const handleProfile = useCallback(() => {
    if (post.actorType === 'business') {
      navigate(`/business/${post.actorId}`);
    } else {
      navigate(`/profile/${post.username || post.userId}`);
    }
  }, [post.actorType, post.actorId, post.username, post.userId, navigate]);

  const isMultiMedia = post.mediaItems.length > 1;
  const media = post.mediaItems[0];

  if (!media) return null;

  return (
    <div
      ref={ref}
      className="relative w-full flex-shrink-0"
      style={{ height: '100dvh' }}
    >
      {isMultiMedia ? (
        <MediaCarousel
          mediaItems={post.mediaItems}
          feedIndex={index}
          isActive={isActive}
          onDoubleTapLike={handleLike}
          onScrubStart={handleScrubStart}
          onScrubEnd={handleScrubEnd}
        />
      ) : media.type === 'video' && media.hlsUrl ? (
        <VideoPlayer
          hlsUrl={media.hlsUrl}
          mp4Url={media.mp4Url}
          feedIndex={index}
          isActive={isActive}
          thumbnailUrl={media.thumbnailUrl}
          duration={media.duration}
          onDoubleTapLike={handleLike}
          onScrubStart={handleScrubStart}
          onScrubEnd={handleScrubEnd}
        />
      ) : media.imageUrl ? (
        <ImageViewer
          imageUrl={media.imageUrl}
          thumbnailUrl={media.thumbnailUrl}
          width={media.width}
          height={media.height}
        />
      ) : null}

      {/* Review banner — top of screen */}
      {post.isReview && post.review && (
        <ReviewBanner
          review={post.review}
          isVisible={isActive && !isScrubbing}
        />
      )}

      {/* Social overlay — action rail + mute */}
      <SocialOverlay
        post={post}
        isActive={isActive}
        isScrubbing={isScrubbing}
        onLike={handleLike}
        isLiked={isLiked}
        likeCount={localLikeCount}
        userId={user?.id}
      />

      {/* Creator capsule — bottom left */}
      <div
        className="absolute z-20"
        style={{
          bottom: 80,
          left: 12,
          right: 80,
          opacity: isScrubbing ? 0 : 1,
          transition: 'opacity 300ms ease',
        }}
      >
        <CreatorCapsule
          post={post}
          isFollowed={isFollowed}
          onFollow={handleFollow}
          onProfile={handleProfile}
          isActive={isActive}
          isScrubbing={isScrubbing}
        />
      </div>

      {/* End of feed overlay */}
      {isLastItem && !hasNextPage && (
        <EndOfFeed visible={isActive} />
      )}
    </div>
  );
}
