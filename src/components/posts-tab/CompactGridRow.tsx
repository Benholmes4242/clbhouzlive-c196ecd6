import React, { useState, useEffect, useRef } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Star, MoreHorizontal } from 'lucide-react';
import { formatDuration, formatDistanceToNowShort } from './utils';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

interface CompactGridRowProps {
  posts: FeedPost[];
  startIndex: number;
  globalIndices?: number[];
  allPosts?: FeedPost[];
  isOwnProfile?: boolean;
  onDeletePost?: (postId: string) => void;
}

const CompactTile: React.FC<{
  post: FeedPost;
  globalIndex: number;
  allPosts?: FeedPost[];
  isOwnProfile?: boolean;
  onDeletePost?: (postId: string) => void;
}> = ({ post, globalIndex, allPosts, isOwnProfile, onDeletePost }) => {
  const [showMenu, setShowMenu] = useState(false);
  const firstMedia = post.mediaItems[0];
  const isVideo = firstMedia?.type === 'video';
  const thumbnailUrl = firstMedia?.thumbnailUrl || firstMedia?.imageUrl;
  const duration = firstMedia?.duration ?? 0;
  const hasReview = post.isReview && post.review;
  const hlsUrl = firstMedia?.hlsUrl;
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // TODO Brief 3: onViewPreload
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hlsUrl]);

  return (
    <div
      ref={tileRef}
      className="relative aspect-[4/5] rounded-[12px] overflow-hidden bg-muted cursor-pointer"
      data-posts-tile-index={globalIndex}
      data-hls-url={firstMedia?.hlsUrl || ''}
      onClick={() => {
        if (showMenu) return;
        useFullscreenFeedStore.getState().open(allPosts ?? [post], globalIndex);
      }}
    >
      {/* Poster image */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Video badge — top-right */}
      {isVideo && duration > 0 && (
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-black/60 backdrop-blur-sm">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-[10px] font-semibold text-white leading-none">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Review rating badge — top-right (never with video badge in compact, reviews route to full-width) */}
      {hasReview && post.review && !isVideo && (
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-[6px] bg-black/60 backdrop-blur-sm">
          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-semibold text-white leading-none">
            {post.review.rating.toFixed(1)}
          </span>
        </div>
      )}

      {/* Caption + sub overlay — bottom gradient */}
      {(post.caption || post.courseName) && (
        <div
          className="absolute left-0 right-0 bottom-0 px-2.5 pb-2.5 pt-6 pointer-events-none"
          style={{
            background:
              'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)',
          }}
        >
          {post.caption && (
            <div
              className="text-[11px] leading-snug font-medium text-white line-clamp-2"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              {post.caption}
            </div>
          )}
          <div
            className="text-[9.5px] text-white/75 mt-0.5 truncate"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            {post.courseName ? `${post.courseName} · ` : ''}
            {formatDistanceToNowShort(new Date(post.createdAt))}
          </div>
        </div>
      )}

      {/* Own-profile menu trigger */}
      {isOwnProfile && onDeletePost && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(true);
          }}
          className="absolute top-1.5 left-1.5 z-10 p-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        >
          <MoreHorizontal className="w-3.5 h-3.5 text-white" />
        </button>
      )}

      {/* Delete confirmation overlay */}
      {showMenu && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onDeletePost?.(post.id);
              setShowMenu(false);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-full active:scale-[0.97]"
          >
            Delete
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="px-4 py-2 text-xs font-medium text-white/80 active:scale-[0.97]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export const CompactGridRow: React.FC<CompactGridRowProps> = ({
  posts,
  startIndex,
  globalIndices,
  allPosts,
  isOwnProfile,
  onDeletePost,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {posts.map((post, i) => (
        <CompactTile
          key={post.id}
          post={post}
          globalIndex={globalIndices ? globalIndices[i] : startIndex + i}
          allPosts={allPosts}
          isOwnProfile={isOwnProfile}
          onDeletePost={onDeletePost}
        />
      ))}
    </div>
  );
};
