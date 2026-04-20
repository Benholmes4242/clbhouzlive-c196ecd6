import React, { useState, useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import { MoreHorizontal } from 'lucide-react';
import { formatDuration, formatDistanceToNowShort } from './utils';

interface LongFormCardProps {
  post: FeedPost;
  allPosts?: FeedPost[];
  postIndex?: number;
  isOwnPost?: boolean;
  onDelete?: () => void;
  likeState?: { isLiked: boolean; count: number };
  onLike?: () => void;
  onComment?: () => void;
}

export const LongFormCard: React.FC<LongFormCardProps> = ({
  post,
  allPosts,
  postIndex,
  isOwnPost,
  onDelete,
}) => {
  const firstMedia = post.mediaItems[0];
  const thumbnailUrl = firstMedia?.thumbnailUrl || firstMedia?.imageUrl;
  const isVideo = firstMedia?.type === 'video';
  const duration = firstMedia?.duration ?? 0;
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

  const timeAgoShort = formatDistanceToNowShort(new Date(post.createdAt));

  return (
    <div
      ref={tileRef}
      className="bg-white overflow-hidden cursor-pointer relative"
      style={{ borderTop: '0.5px solid rgba(15,23,42,0.06)', borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}
      onClick={() => {
        if (allPosts && postIndex != null) {
          useFullscreenFeedStore.getState().open(allPosts, postIndex);
        }
      }}
    >
      {/* Media — 16:9 */}
      <div
        className="relative w-full bg-slate-200"
        style={{ aspectRatio: '16 / 9' }}
        data-posts-tile-index={postIndex ?? -1}
        data-hls-url={hlsUrl || ''}
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Play affordance — centred on videos only */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 56,
                height: 56,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration badge — bottom-right */}
        {isVideo && duration > 0 && (
          <div
            className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-[6px]"
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span className="text-[11px] font-semibold text-white leading-none">
              {formatDuration(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-3.5 pt-3 pb-3.5">
        {post.caption && (
          <div className="text-[14px] leading-snug text-slate-900 line-clamp-3">
            {post.caption}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
          {post.courseName && (
            <>
              <span className="truncate">{post.courseName}</span>
              <span className="w-[3px] h-[3px] rounded-full bg-slate-300 flex-shrink-0" />
            </>
          )}
          <span className="flex-shrink-0">{timeAgoShort} ago</span>
        </div>
      </div>

      {/* Own-post menu */}
      {isOwnPost && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this post?')) onDelete();
          }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        >
          <MoreHorizontal className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  );
};
