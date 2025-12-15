import React from 'react';
import { Pin, X } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface PinnedPost {
  id: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
}

interface PinnedPostsSectionProps {
  posts: PinnedPost[];
  isOwner: boolean;
  onPostClick?: (postId: string) => void;
  onUnpinClick?: (postId: string) => void;
  className?: string;
}

/**
 * Phase 3.2B: Pinned Posts Section for Creators
 * 
 * Displays up to 3 pinned posts at the top of the creator's content grid.
 * Owners can unpin posts directly from this section.
 */
export function PinnedPostsSection({ 
  posts, 
  isOwner, 
  onPostClick,
  onUnpinClick,
  className 
}: PinnedPostsSectionProps) {
  // Don't render if no pinned posts
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Pin className="h-3.5 w-3.5 text-[#F7931E]" />
        <span className="text-xs font-medium text-[#5E666D] uppercase tracking-wide">
          Pinned
        </span>
      </div>

      {/* Pinned posts row */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {posts.slice(0, 3).map((post) => (
          <div key={post.id} className="relative flex-shrink-0 group">
            <button
              onClick={() => onPostClick?.(post.id)}
              className="block w-24 h-24 rounded-sq-md overflow-hidden bg-[#EDEFF2] hover:opacity-90 transition-opacity"
              style={{ border: '1px solid rgba(31,36,40,0.08)' }}
            >
              {post.thumbnailUrl ? (
                <img 
                  src={post.thumbnailUrl} 
                  alt="Pinned post" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Pin className="h-6 w-6 text-[#97A1AA]" />
                </div>
              )}
              
              {/* Pinned indicator */}
              <span 
                className="absolute bottom-1 left-1 flex items-center justify-center w-5 h-5 rounded-full"
                style={{ background: 'rgba(247, 147, 30, 0.9)' }}
              >
                <Pin className="h-2.5 w-2.5 text-white" />
              </span>
            </button>

            {/* Unpin button for owners */}
            {isOwner && onUnpinClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpinClick(post.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                style={{ border: '1px solid rgba(31,36,40,0.08)' }}
                title="Unpin"
              >
                <X className="h-3 w-3 text-[#5E666D]" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PinnedPostsSection;
