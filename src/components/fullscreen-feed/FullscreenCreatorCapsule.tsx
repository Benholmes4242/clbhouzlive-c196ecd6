import React, { useState } from 'react';
import { useStore } from 'zustand';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FeedPost } from '@/components/media-system/types/media';
import type { MediaStore } from '@/components/media-system/store/createMediaStore';

interface FullscreenCreatorCapsuleProps {
  posts: FeedPost[];
  store: MediaStore;
}

export function FullscreenCreatorCapsule({ posts, store }: FullscreenCreatorCapsuleProps) {
  const activeIndex = useStore(store, (s) => s.activeIndex);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const activePost = posts[activeIndex];

  // Reset expanded when post changes
  React.useEffect(() => {
    setExpanded(false);
  }, [activeIndex]);

  if (!activePost) return null;

  const courseName = activePost.review?.courseName || activePost.courseName;

  return (
    <div
      className="fixed left-3 right-16 z-[10000] flex flex-col gap-1.5"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
    >
      {/* Creator row */}
      <button
        onClick={() => navigate(`/profile/${activePost.userId}`)}
        className="flex items-center gap-2"
      >
        {activePost.avatarUrl && (
          <img
            src={activePost.avatarUrl}
            alt=""
            className="w-7 h-7 rounded-full object-cover border-2 border-white shrink-0"
          />
        )}
        <span
          className="text-sm font-bold text-white truncate"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
          {activePost.displayName}
        </span>
        {activePost.isVerified && (
          <svg className="h-3.5 w-3.5 text-blue-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Caption */}
      {activePost.caption && (
        <div>
          <p
            className={`text-sm text-white/90 ${expanded ? '' : 'line-clamp-2'}`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            {activePost.caption}
          </p>
          {!expanded && activePost.caption.length > 80 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-sm font-semibold text-white/70 mt-0.5"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              more
            </button>
          )}
        </div>
      )}

      {/* Course tag */}
      {courseName && (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-white/70 shrink-0" />
          <span
            className="text-xs text-white/70 truncate"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            {courseName}
          </span>
        </div>
      )}
    </div>
  );
}
