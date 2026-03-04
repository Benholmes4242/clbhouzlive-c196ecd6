/**
 * CreatorCapsule — Expandable bottom-left creator info with follow/profile.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import type { FeedPost } from './types/media';

interface CreatorCapsuleProps {
  post: FeedPost;
  isFollowed: boolean;
  onFollow: () => void;
  onProfile: () => void;
  isActive: boolean;
  isScrubbing: boolean;
}

function VerifiedBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 4, flexShrink: 0 }}>
      <circle cx="7" cy="7" r="7" fill="#3B82F6" />
      <path d="M4.5 7L6.5 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AvatarFallback({ displayName, userId }: { displayName: string; userId: string }) {
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hue = parseInt(userId.slice(0, 8), 16) % 360;

  return (
    <div
      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
      style={{
        background: `hsl(${hue}, 45%, 55%)`,
        border: '2px solid rgba(255,255,255,0.3)',
        fontSize: 12,
        fontWeight: 700,
        color: '#FFFFFF',
      }}
    >
      {initials}
    </div>
  );
}

function getRelativeTime(createdAt: string): string {
  const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function CreatorCapsule({ post, isFollowed, onFollow, onProfile, isActive, isScrubbing }: CreatorCapsuleProps) {
  const [expanded, setExpanded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const capsuleRef = useRef<HTMLDivElement>(null);

  // Collapse on post change or scrub
  useEffect(() => {
    setExpanded(false);
    setAvatarError(false);
  }, [post.id]);

  useEffect(() => {
    if (isScrubbing) setExpanded(false);
  }, [isScrubbing]);

  // Close on outside tap
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (capsuleRef.current && !capsuleRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [expanded]);

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('light');
    setExpanded(prev => !prev);
  }, []);

  const handleFollow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('medium');
    onFollow();
  }, [onFollow]);

  const handleProfile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('light');
    onProfile();
  }, [onProfile]);

  const subtitleText = post.isReview && post.review
    ? post.review.courseName
    : post.caption?.slice(0, 40) || '';

  return (
    <div
      ref={capsuleRef}
      className="pointer-events-auto"
      style={{
        background: 'rgba(0, 0, 0, 0.55)',
        borderRadius: 16,
        padding: 12,
        maxWidth: '75%',
        animation: 'capsuleSlideIn 300ms ease-out',
      }}
      onClick={toggleExpand}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-2">
        {/* Avatar */}
        {post.avatarUrl && !avatarError ? (
          <img
            src={post.avatarUrl}
            alt={post.displayName}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            style={{ border: '2px solid rgba(255,255,255,0.3)' }}
            onError={() => setAvatarError(true)}
          />
        ) : (
          <AvatarFallback displayName={post.displayName || 'U'} userId={post.userId} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-0.5">
            <span
              className="text-sm font-semibold text-white truncate"
              style={{ maxWidth: 160, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              {post.displayName || post.username || 'Unknown'}
            </span>
            {post.isVerified && <VerifiedBadge />}
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/50 ml-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/50 ml-1 flex-shrink-0" />
            )}
          </div>

          {/* Subtitle */}
          {!expanded && subtitleText && (
            <p
              className="text-xs truncate mt-0.5"
              style={{
                color: post.isReview ? '#F59E0B' : 'rgba(255,255,255,0.6)',
                maxWidth: 200,
              }}
            >
              {subtitleText}
            </p>
          )}
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-2 space-y-2">
              {/* @username */}
              {post.actorType !== 'business' && post.username && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  @{post.username}
                </p>
              )}

              {/* Course info for reviews */}
              {post.isReview && post.review && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#F59E0B' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#F59E0B' }}>
                    {post.review.courseName}
                  </span>
                </div>
              )}

              {/* Read review link */}
              {post.isReview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic('light');
                    // TODO: navigate to review/course detail
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#F59E0B',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Read review ›
                </button>
              )}

              {/* Caption preview */}
              {post.caption && (
                <p
                  className="text-xs leading-snug"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.caption}
                </p>
              )}

              {/* Timestamp */}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                {getRelativeTime(post.createdAt)}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleFollow}
                  className="h-8 px-4 rounded-full text-xs font-semibold transition-all"
                  style={
                    isFollowed
                      ? {
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: '#FFFFFF',
                        }
                      : {
                          background: '#FFFFFF',
                          border: '1px solid #FFFFFF',
                          color: '#000000',
                        }
                  }
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleProfile}
                  className="h-8 px-4 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#FFFFFF',
                  }}
                >
                  Profile
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
