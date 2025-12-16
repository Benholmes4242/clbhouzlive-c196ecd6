/**
 * BusinessActivityCard - Single vertical card for business activity feed
 * DO NOT reuse personal profile grid components
 */
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Play, ThumbsUp, MessageCircle, MapPin } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface BusinessActivityPost {
  id: string;
  content: string | null;
  created_at: string;
  post_type?: 'standard' | 'announcement' | 'review';
  post_media: Array<{
    id: string;
    media_url: string;
    media_type: string;
    poster_url: string | null;
  }>;
  likes_count?: number;
  comments_count?: number;
  location?: string | null;
}

interface BusinessActivityCardProps {
  post: BusinessActivityPost;
  businessName: string;
  businessLogo?: string | null;
  isOwner?: boolean;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEngagementClick?: (postId: string) => void;
}

export function BusinessActivityCard({
  post,
  businessName,
  businessLogo,
  isOwner = false,
  onEdit,
  onDelete,
  onEngagementClick,
}: BusinessActivityCardProps) {
  const [contentExpanded, setContentExpanded] = useState(false);
  
  const primaryMedia = post.post_media?.[0];
  const isVideo = primaryMedia?.media_type === 'video';
  const mediaUrl = isVideo ? primaryMedia?.poster_url || primaryMedia?.media_url : primaryMedia?.media_url;
  const hasMultipleMedia = post.post_media?.length > 1;
  
  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false })
    .replace('about ', '')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' weeks', 'w')
    .replace(' week', 'w')
    .replace(' months', 'mo')
    .replace(' month', 'mo');
  
  // Content truncation
  const contentText = post.content || '';
  const shouldTruncate = contentText.length > 200;
  const displayContent = shouldTruncate && !contentExpanded 
    ? contentText.slice(0, 200) + '…' 
    : contentText;

  // Initials fallback
  const initials = businessName
    ?.split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase() || 'B';

  return (
    <article 
      className="bg-white rounded-sq-lg overflow-hidden"
      style={{
        boxShadow: '0 2px 12px rgba(31, 36, 40, 0.06)',
        border: '1px solid rgba(31, 36, 40, 0.06)'
      }}
    >
      {/* Header - Minimal */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Business Avatar */}
          <div className="w-10 h-10 clbhouz-squircle overflow-hidden bg-slate-100 flex-shrink-0">
            {businessLogo ? (
              <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-500">
                {initials}
              </div>
            )}
          </div>
          
          {/* Name + Meta */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1F2428] truncate">{businessName}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{timeAgo} ago</span>
              {post.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 truncate">
                    <MapPin className="w-3 h-3" />
                    {post.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post Type Pill + Admin Menu */}
        <div className="flex items-center gap-2">
          {/* Announcement pill */}
          {post.post_type === 'announcement' && (
            <span 
              className="px-2.5 py-1 text-[11px] font-medium rounded-full"
              style={{ 
                background: 'rgba(100, 116, 139, 0.1)', 
                color: '#64748b' 
              }}
            >
              Announcement
            </span>
          )}
          
          {/* Review pill */}
          {post.post_type === 'review' && (
            <span 
              className="px-2.5 py-1 text-[11px] font-medium rounded-full"
              style={{ 
                background: 'rgba(251, 191, 36, 0.15)', 
                color: '#b45309' 
              }}
            >
              ⭐ Review
            </span>
          )}
          
          {/* Admin menu */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit?.(post.id)}>
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(post.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Media Block - Hero first, always before text */}
      {primaryMedia && (
        <div className="relative aspect-[4/5] max-h-[500px] overflow-hidden bg-slate-100">
          <img
            src={mediaUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          
          {/* Video indicator */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}
          
          {/* Carousel dots indicator */}
          {hasMultipleMedia && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {post.post_media.slice(0, 5).map((_, idx) => (
                <div 
                  key={idx}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ 
                    background: idx === 0 ? 'white' : 'rgba(255,255,255,0.5)' 
                  }}
                />
              ))}
              {post.post_media.length > 5 && (
                <span className="text-[10px] text-white/80 ml-1">+{post.post_media.length - 5}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Copy Block - Optional, max 3-4 lines visible */}
      {contentText && (
        <div className="px-4 py-3">
          <p className="text-sm text-[#1F2428] leading-relaxed whitespace-pre-wrap" style={{ overflowWrap: 'anywhere' }}>
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setContentExpanded(!contentExpanded)}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 mt-1"
            >
              {contentExpanded ? 'Less' : 'More'}
            </button>
          )}
        </div>
      )}

      {/* Social Proof Strip - Read-only engagement counts */}
      <footer 
        className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => onEngagementClick?.(post.id)}
        style={{ borderTop: '1px solid rgba(31, 36, 40, 0.06)' }}
      >
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <ThumbsUp className="w-4 h-4" />
          <span>{post.likes_count ?? 0} golfers liked this</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count ?? 0} comments</span>
        </span>
      </footer>
    </article>
  );
}
