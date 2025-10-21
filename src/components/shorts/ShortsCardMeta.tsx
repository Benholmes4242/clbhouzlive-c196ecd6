import React from 'react';
import { Heart } from 'lucide-react';
import { BadgeCheck } from 'lucide-react';

// Creator-First metadata block
type Props = {
  author: { 
    id: string; 
    name: string; 
    avatar: string; 
    verified?: boolean; 
    isSelf?: boolean;
  };
  caption: string;
  likeCount: number;
  isLiked: boolean;
  onLikeToggle: () => void;
  onAuthorClick: (id: string) => void;
  className?: string;
};

export default function ShortsCardMeta({
  author, 
  caption, 
  likeCount, 
  isLiked, 
  onLikeToggle, 
  onAuthorClick, 
  className
}: Props) {
  return (
    <div className={`scm ${className ?? ''}`}>
      {/* Row 1: avatar + name (left) | like (right) */}
      <div className="scm-row1">
        <button 
          className="scm-author" 
          onClick={(e) => {
            e.stopPropagation();
            onAuthorClick(author.id);
          }}
          aria-label={`View ${author.name}'s profile`}
        >
          <span className={`scm-avatar${author.isSelf ? ' ring' : ''}`}>
            <img 
              src={author.avatar} 
              alt={`${author.name} avatar`} 
              loading="lazy" 
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img/avatar-fallback.png';
              }}
            />
          </span>
          <span className="scm-name">{author.name}</span>
          {author.verified && (
            <BadgeCheck 
              className="scm-verified" 
              aria-label="Verified" 
              size={14}
            />
          )}
        </button>

        <button
          className={`scm-like${isLiked ? ' liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onLikeToggle();
          }}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} post by ${author.name}, ${formatLikes(likeCount)} likes`}
        >
          <Heart 
            className="scm-heart" 
            size={18}
            fill={isLiked ? '#6e9277' : 'none'}
            aria-hidden="true"
          />
          <span className="scm-likes">{formatLikes(likeCount)}</span>
        </button>
      </div>

      {/* Row 2: caption (2-line clamp + fade) */}
      <p className="scm-caption">{caption}</p>
    </div>
  );
}

// Utils (inline for now; move to utils/formatLikes.ts in PR2 if preferred)
function formatLikes(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
