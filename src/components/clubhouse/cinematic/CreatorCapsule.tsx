/**
 * CreatorCapsule - Bottom-left floating adaptive capsule
 * 
 * Two modes:
 * - Regular: Shows creator info (avatar, username, caption, course, music)
 * - Review: Shows review info ("Rated this course • 8.5 EXCELLENT") with tier colors
 * 
 * Collapsed: Single row pill with mode-specific content
 * Expanded: Reveals caption, follow button, profile/course links
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { ChevronUp, User, Music, ChevronRight } from 'lucide-react';
import { getProfilePathById } from '@/lib/profileRoutes';
import CourseLocationRow from '@/components/posts/CourseLocationRow';
import { getReviewOverlayTheme, type ExtractedReviewData } from '@/lib/postHelpers';
import { RatingPill } from '@/components/ui/RatingPill';

/** Animated soundwave bars for music playback indicator */
const SoundwaveAnimation: React.FC = () => (
  <div className="flex items-center gap-0.5 h-3 ml-2 flex-shrink-0">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-0.5 bg-white/60 rounded-full"
        animate={{
          height: ['3px', '12px', '6px', '10px', '3px'],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
        }}
      />
    ))}
  </div>
);

interface GolfCourseInfo {
  id?: string | null;
  name?: string | null;
  region?: string | null;
  country?: string | null;
  sub_country?: string | null;
  slug?: string | null;
}

interface MusicTrackInfo {
  title?: string;
  artist?: string;
}

interface CreatorCapsuleProps {
  // Regular mode props
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  caption?: string;
  golfCourse?: GolfCourseInfo | null;
  /** Music track info - only shown when audioMode === 'music_only' */
  musicTrack?: MusicTrackInfo | null;
  /** Whether music is currently playing (unmuted + has music) */
  isMusicPlaying?: boolean;
  isFollowing?: boolean;
  isOwnPost?: boolean;
  isVisible: boolean;
  onFollow?: () => void;
  onViewProfile?: () => void;
  /** Optional callback when music row is tapped (e.g., toggle mute) */
  onMusicTap?: () => void;
  
  // NEW: Review mode props
  /** Whether this is a review post */
  isReview?: boolean;
  /** Review data for review mode */
  reviewData?: ExtractedReviewData;
  /** Callback when review capsule is tapped */
  onReviewTap?: () => void;
}

export const CreatorCapsule: React.FC<CreatorCapsuleProps> = ({
  user,
  caption,
  golfCourse,
  musicTrack,
  isMusicPlaying = false,
  isFollowing = false,
  isOwnPost = false,
  isVisible,
  onFollow,
  onViewProfile,
  onMusicTap,
  // Review mode
  isReview = false,
  reviewData,
  onReviewTap,
}) => {
  console.log('[CreatorCapsule] rendered', { isReview, userId: user.id, userName: user.name });
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const capsuleRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  // Get review theme if in review mode
  const reviewTheme = isReview && reviewData 
    ? getReviewOverlayTheme(reviewData.rating)
    : null;
  const isOutstanding = isReview && reviewData && reviewData.rating >= 9.0;

  const handleToggle = useCallback(() => {
    if (isReview) {
      // In review mode, tap navigates to course
      onReviewTap?.();
      return;
    }
    setIsExpanded(prev => !prev);
  }, [isReview, onReviewTap]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    
    if (isExpanded && deltaY > 40) {
      // Swipe down when expanded: collapse
      setIsExpanded(false);
    }
    startYRef.current = null;
  }, [isExpanded]);

  const handleViewProfile = useCallback(() => {
    if (onViewProfile) {
      onViewProfile();
    } else {
      const path = getProfilePathById(user.id);
      navigate(path);
    }
  }, [navigate, onViewProfile, user.id]);
  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';

  // Truncate caption for collapsed state
  const truncatedCaption = caption && caption.length > 80 
    ? `${caption.slice(0, 80)}...` 
    : caption;

  // When the golf club tag is present, avoid the two-stage collapse (height first, then width)
  // by letting layout reflow immediately while the expanded panel animates out.
  const popLayoutForGolfTag = !!golfCourse;

  const expandedInner = (
    <div className="px-3 pb-3 space-y-3">
      {/* Caption (scrollable) */}
      {caption && (
        <div 
          className="max-h-[100px] overflow-y-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <p className="text-[13px] leading-relaxed text-white/90">
            {caption}
          </p>
        </div>
      )}

      {/* Golf Course CTA - one-line gap after caption */}
      {golfCourse && (
        <div className={cn(caption && "mt-2")}>
          <CourseLocationRow
            course={golfCourse}
            showChevron
            isDark
          />
        </div>
      )}

      {/* Music Track Row - same spacing as golf course */}
      {musicTrack?.title && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMusicTap?.();
          }}
          className={cn(
            "flex items-center gap-2 w-full text-left",
            onMusicTap && "hover:opacity-80 transition-opacity"
          )}
        >
          <Music className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
          {/* Left-aligned group: text + soundwave together */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[12px] text-white/60 truncate">
              {musicTrack.title}
              {musicTrack.artist && ` • ${musicTrack.artist}`}
            </span>
            {/* Soundwave animation - sits immediately after song text */}
            {isMusicPlaying && <SoundwaveAnimation />}
          </div>
        </button>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/10">
        {/* Follow button (not for own posts) */}
        {!isOwnPost && onFollow && (
          <Button
            size="sm"
            variant={isFollowing ? 'secondary' : 'default'}
            onClick={(e) => {
              e.stopPropagation();
              onFollow();
            }}
            className={cn(
              'h-8 px-3 text-[12px] font-medium rounded-sq-sm',
              isFollowing 
                ? 'bg-white/10 text-white hover:bg-white/15' 
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}

        {/* View Profile */}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile();
          }}
          className="h-8 px-3 text-[12px] font-medium rounded-sq-sm text-white/80 hover:text-white hover:bg-white/10"
        >
          <User className="w-3.5 h-3.5 mr-1" />
          Profile
        </Button>

      </div>
    </div>
  );

  // Get initials for avatar fallback
  const userInitials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';

  // Navigate to user profile
  const handleUserTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const path = getProfilePathById(user.id);
    navigate(path);
  }, [navigate, user.id]);

  // Review mode content - matches regular capsule layout exactly
  const reviewContent = reviewData && (
    <div
      onClick={handleUserTap}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer"
    >
      {/* Avatar - same size as regular capsule */}
      <SquircleAvatar
        size={40}
        src={user?.avatar}
        alt={user?.name ?? 'Creator'}
        fallback={userInitials}
        hideRing
      />
      
      {/* Name + CTA stacked */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {user?.name || 'Golfer'}
        </div>
        {/* Read review CTA - same position as caption preview in regular capsule */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReviewTap?.();
          }}
          className={cn(
            "flex items-center gap-0.5 mt-0.5",
            "text-[11px] font-medium",
            "transition-opacity duration-150",
            isOutstanding 
              ? "text-amber-400/90 hover:text-amber-300"
              : "text-white/60 hover:text-white/80"
          )}
        >
          <span>Read review</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  // Regular mode collapsed content
  const regularCollapsedContent = (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5',
        'text-left',
        // No hover/active/focus states - static identity element
        'hover:bg-transparent active:bg-transparent focus:bg-transparent',
        'active:opacity-100 focus-visible:outline-none'
      )}
    >
      {/* Avatar */}
      <SquircleAvatar
        size={40}
        src={user?.avatar}
        alt={user?.name ?? 'Creator'}
        fallback={initials}
        hideRing
      />

      {/* Display Name - never username */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-white truncate">
            {user?.name || 'Golfer'}
          </span>
        </div>
        
        {/* Caption preview (collapsed) */}
        {!isExpanded && caption && (
          <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
            {truncatedCaption}
          </p>
        )}
      </div>

      {/* Expand/Collapse chevron */}
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0"
      >
        <ChevronUp className="w-4 h-4 text-white/50" />
      </motion.div>
    </button>
  );

  // Determine border color based on mode
  const borderColor = isReview && isOutstanding 
    ? 'rgba(210, 180, 97, 0.3)' 
    : 'rgba(255, 255, 255, 0.08)';

  return (
    <>
      {/* Backdrop for tap-outside when expanded */}
      <AnimatePresence>
        {isExpanded && !isReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[49] bg-transparent"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Capsule Container - Enhanced glass effect */}
      <motion.div
        ref={capsuleRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          y: isVisible ? 0 : 20 
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'fixed z-50',
          'pointer-events-auto',
          // Review mode: narrower, floating with more edge spacing
          isReview 
            ? 'left-5 right-auto max-w-[280px]' 
            : 'left-4 max-w-[75vw] min-w-[200px]'
        )}
        style={{
          // 105px = 90px bottom nav + 15px clearance (project standard)
          bottom: isReview 
            ? 'calc(env(safe-area-inset-bottom, 0px) + 113px)'
            : 'calc(env(safe-area-inset-bottom, 0px) + 105px)',
        }}
      >
        <motion.div
          layout
          transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
          className={cn(
            'overflow-hidden',
            // Both modes use rounded-xl for consistency with ReviewOverlayCore
            'rounded-xl'
          )}
          style={{ 
            borderColor: isReview 
              ? (isOutstanding ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.06)')
              : borderColor,
            background: isReview 
              ? (isOutstanding 
                  ? 'rgba(251, 191, 36, 0.05)'
                  : 'rgba(0, 0, 0, 0.35)')
              : 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px) saturate(130%)',
            WebkitBackdropFilter: 'blur(12px) saturate(130%)',
            border: `1px solid ${isReview ? (isOutstanding ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.06)') : 'rgba(255, 255, 255, 0.06)'}`,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Collapsed State - mode-dependent */}
          {isReview ? reviewContent : regularCollapsedContent}

          {/* Expanded Content - only for regular mode */}
          {!isReview && (
            <AnimatePresence mode={popLayoutForGolfTag ? 'popLayout' : 'sync'}>
              {isExpanded && (
                <motion.div
                  key="expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  className="overflow-hidden"
                >
                  {expandedInner}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </>
  );
};

export default CreatorCapsule;
