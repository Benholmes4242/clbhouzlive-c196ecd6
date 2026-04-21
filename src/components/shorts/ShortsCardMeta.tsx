import React from 'react';
import { SquircleAvatar } from '../ui/SquircleAvatar';
import { Heart } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

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
      {/* Avatar stays on the left */}
      <button 
        className="scm__avatarWrap" 
        onClick={(e) => {
          e.stopPropagation();
          onAuthorClick(author.id);
        }}
        aria-label={`Open ${author.name}'s profile`}
      >
        <SquircleAvatar 
          size={36} 
          src={author.avatar} 
          alt={author.name}
          ringColor={author.isSelf ? 'hsl(var(--primary))' : undefined}
        />
      </button>

      {/* Centered stack: name → likes → caption */}
      <div className="scm__stack">
        <div className="scm__nameRow">
          <span className="scm__name scm__name--black">{author.name}</span>
          {author.verified && (
            <VerifiedBadge size="sm" />
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
          {isLiked ? (
            <Heart className="scm__heart" size={14} strokeWidth={1.8} style={{ color: '#F7931E', fill: '#F7931E' }} aria-hidden="true" />
          ) : (
            <Heart className="scm__heart" size={14} fill="none" aria-hidden="true" />
          )}
          <span className="scm__likes">{formatLikes(likeCount)}</span>
        </button>
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
