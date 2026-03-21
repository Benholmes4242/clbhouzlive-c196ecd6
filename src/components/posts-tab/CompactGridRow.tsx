import React, { useState, useEffect, useRef } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Play, Star, Heart, MoreHorizontal } from 'lucide-react';
import { formatDuration, formatCompact } from './utils';
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
  const duration = firstMedia?.duration;
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
      className="relative aspect-[4/5] rounded-[4px] overflow-hidden bg-muted cursor-pointer"
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
          className="absolute inset-0 w-full h-full object-cover z-0"
          loading="lazy"
        />
      )}

      {/* Video play icon */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center z-2 pointer-events-none">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Three dots — own post delete */}
      {isOwnProfile && onDeletePost && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(true);
          }}
          className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full"
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
              onDeletePost(post.id);
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

      {/* Duration badge — bottom right (matches WatchTile) */}
      {isVideo && duration != null && duration > 0 && (
        <div
          className="absolute bottom-1.5 right-1.5 z-10 rounded-[4px] flex items-center"
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            padding: '2px 5px',
          }}
        >
          <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Review rating badge */}
      {hasReview && post.review && (
        <div
          className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-medium text-white z-3"
          style={{
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
          {post.review.rating.toFixed(1)}
        </div>
      )}

      {/* Like count — bottom left (matches WatchTile) */}
      {post.likeCount > 0 && (
        <div
          className="absolute bottom-1.5 left-1.5 z-10 rounded-[4px] flex items-center gap-[3px]"
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            padding: '2px 5px',
          }}
        >
          <Heart className="w-[10px] h-[10px]" style={{ color: 'rgba(245, 158, 11, 0.9)', fill: 'rgba(245, 158, 11, 0.9)' }} />
          <span className="text-[11px] font-medium text-white">
            {formatCompact(post.likeCount)}
          </span>
        </div>
      )}
    </div>
  );
};

export const CompactGridRow: React.FC<CompactGridRowProps> = ({ posts, startIndex, globalIndices, allPosts, isOwnProfile, onDeletePost }) => {
  return (
    <div className="grid grid-cols-2 gap-[2px]">
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