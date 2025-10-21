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
    <div className={`scm scm--center ${className ?? ''}`}>
      {/* Centered stack: avatar + name + verified → likes → caption */}
      <div className="scm__stack">
        <div className="scm__nameRow">
          <button 
            className="scm__avatarWrap" 
            onClick={(e) => {
              e.stopPropagation();
              onAuthorClick(author.id);
            }}
            aria-label={`Open ${author.name}'s profile`}
          >
            <img 
              className={`scm__avatar${author.isSelf ? ' ring' : ''}`}
              src={author.avatar} 
              alt={`${author.name} avatar`} 
              loading="lazy" 
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img/avatar-fallback.png';
              }}
            />
          </button>
          <span className="scm__name scm__name--black">{author.name}</span>
          {author.verified && (
            <BadgeCheck 
              className="scm__verified" 
              aria-label="Verified" 
              size={14}
            />
          )}
        </div>

        <button
          className={`scm__likeCenter${isLiked ? ' is-liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if ('vibrate' in navigator) navigator.vibrate(10);
            onLikeToggle();
          }}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} post by ${author.name}`}
        >
          <Heart 
            className="scm__heart" 
            size={18}
            fill={isLiked ? '#6e9277' : 'none'}
            aria-hidden="true"
          />
          <span className="scm__likes">{formatLikes(likeCount)}</span>
        </button>

        <p className="scm__caption scm__caption--full">{caption}</p>
      </div>
    </div>
  );
}

// Utils (inline for now; move to utils/formatLikes.ts in PR2 if preferred)
function formatLikes(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
