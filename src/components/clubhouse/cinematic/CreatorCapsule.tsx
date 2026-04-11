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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FeedCarouselDots } from '@/components/feed/FeedCarouselDots';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ChevronUp, User, Music, ChevronRight } from 'lucide-react';
import { FiMapPin } from 'react-icons/fi';
import { getProfilePathById } from '@/lib/profileRoutes';
import { CourseDNACard } from './CourseDNACard';

import { type ExtractedReviewData } from '@/lib/postHelpers';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import PostContentWithTags from '@/components/posts/PostContentWithTags';

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
  /** Country name for display (e.g. 'Portugal') */
  courseCountry?: string | null;
  // Extended fields for CourseDNACard
  globalRank?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  thumbnailImage?: string | null;
  hasHostedMajor?: boolean | null;
}

interface MusicTrackInfo {
  title?: string;
  artist?: string;
}

interface PostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  start_index?: number;
  end_index?: number;
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
  tags?: PostTag[];
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
  /** Post ID for crossfade animation on post change */
  postId?: string;

  /** Called before any in-component navigate() to allow overlay cleanup */
  onBeforeNavigate?: () => void;

  /** Override the bottom offset (default: 'calc(30px + 80px)' for tab bar context).
   *  Use for fullscreen viewer where there's no tab bar. */
  bottomOffset?: string;

  /** Carousel dot indicators — rendered 8px above the capsule */
  carouselCount?: number;
  carouselActiveIndex?: number;
}

export const CreatorCapsule: React.FC<CreatorCapsuleProps> = ({
  user,
  caption,
  tags = [],
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
  // Post ID for crossfade
  postId,
  // Before-navigate callback
  onBeforeNavigate,
  // Bottom offset override
  bottomOffset,
  // Carousel dots
  carouselCount = 0,
  carouselActiveIndex = 0,
}) => {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const capsuleRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);



  const handleToggle = useCallback(() => {
    if (isReview) {
      // In review mode, tap navigates to course
      onBeforeNavigate?.();
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
    
    if (!isExpanded && !isReview && deltaY < -40) {
      // Swipe up when collapsed: expand (regular mode only)
      setIsExpanded(true);
    }
    startYRef.current = null;
  }, [isExpanded, isReview]);

  const handleViewProfile = useCallback(() => {
    onBeforeNavigate?.();
    if (onViewProfile) {
      onViewProfile();
    } else {
      const path = getProfilePathById(user.id);
      navigate(path);
    }
  }, [navigate, onViewProfile, onBeforeNavigate, user.id]);

  // Clean caption: strip embedded "Played at" course text
  const cleanCaption = caption ? removeGolfCourseFromContent(caption) : '';
  
  // Truncate caption for collapsed state
  const truncatedCaption = cleanCaption && cleanCaption.length > 80 
    ? `${cleanCaption.slice(0, 80)}...` 
    : cleanCaption;

  // Build course display label: "{name}, {country}" or just "{name}"
  const courseDisplayLabel = golfCourse?.name
    ? golfCourse.courseCountry
      ? `${golfCourse.name}, ${golfCourse.courseCountry}`
      : golfCourse.name
    : null;

  // When the golf club tag is present, avoid the two-stage collapse (height first, then width)
  // by letting layout reflow immediately while the expanded panel animates out.
  const popLayoutForGolfTag = !!golfCourse;

  // Get initials for avatar fallback
  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';

  const expandedInner = (
    <div className="px-3 pb-3 space-y-3">
      {/* Caption (scrollable) */}
      {cleanCaption && (
        <div
          className="max-h-[100px] overflow-y-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {tags.length > 0 ? (
            <div style={{ ['--mention-color' as any]: 'rgba(255,255,255,0.90)' }}>
              <PostContentWithTags
                content={cleanCaption}
                tags={tags}
                className="text-[13px] leading-relaxed text-white/90"
              />
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-white/90">{cleanCaption}</p>
          )}
        </div>
      )}

      {/* Golf Course CTA — CourseDNACard when id available, fallback row otherwise */}
      {golfCourse?.id && (() => {
        const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xiaG91eiIsImEiOiJjbTVyejIzMXcxemx2MmpzZDU3YjkxNjNkIn0.H_w9d-UAvvMRkJ_9DoVQ-A';
        return <CourseDNACard
          courseId={golfCourse.id}
          courseName={golfCourse.name || ''}
          courseCountry={golfCourse.courseCountry || golfCourse.country || ''}
          mapboxToken={MAPBOX_TOKEN}
          onNavigate={() => {
            onBeforeNavigate?.();
            navigate(`/courses/${golfCourse.slug || golfCourse.id}`);
          }}
        />;
      })()}

      {/* Fallback for caption-extracted courses with no id */}
      {!golfCourse?.id && golfCourse?.name && courseDisplayLabel && (
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            onBeforeNavigate?.();
            if (golfCourse.name) {
              try {
                const { data } = await supabase
                  .from('golf_courses')
                  .select('id')
                  .ilike('name', golfCourse.name.trim())
                  .limit(1)
                  .single();
                if (data?.id) {
                  navigate(`/courses/${data.id}`);
                } else {
                  navigate(`/courses?search=${encodeURIComponent(golfCourse.name)}`);
                }
              } catch {
                navigate(`/courses?search=${encodeURIComponent(golfCourse.name)}`);
              }
            }
          }}
          className="flex items-start gap-2 py-2.5 text-left w-full cursor-pointer active:scale-[0.98] active:opacity-80 transition-all"
        >
          <FiMapPin size={14} className="text-white/60 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-[13px] leading-tight truncate text-white/90">
              {golfCourse.name}
            </span>
            {golfCourse.courseCountry && (
              <span className="text-xs leading-tight truncate text-white/60">
                {golfCourse.courseCountry}
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-white/40" />
        </button>
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
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              onFollow();
            }}
            className={cn(
              'h-10 px-4 text-[13px] font-semibold rounded-sq-sm transition-colors',
              isFollowing 
                ? 'bg-white/10 text-white hover:bg-white/15' 
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </motion.button>
        )}

        {/* View Profile */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile();
          }}
          className="h-10 flex items-center gap-1 px-3 text-[13px] font-medium rounded-sq-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          Profile
        </motion.button>

      </div>
    </div>
  );

  // Review mode content - matches regular capsule layout exactly
  const reviewContent = reviewData && (() => {
    const accent = '#f59e0b';

    const locationParts = [
      (reviewData as any).courseSubCountry || (reviewData as any).courseRegion,
      (reviewData as any).courseCountry,
    ].filter(Boolean);
    const locationStr = locationParts.join(', ');

    const captionText = (reviewData as any).reviewText || null;

    return (
      <div
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onReviewTap?.();
        }}
        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
      >
        {/* Watermark score — bleeds into background */}
        <div style={{
          position: 'absolute',
          top: -14,
          right: -6,
          fontSize: 120,
          fontWeight: 900,
          color: 'rgba(245,158,11,0.055)',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          userSelect: 'none',
          pointerEvents: 'none',
          fontFamily: 'Georgia, serif',
        }}>
          {reviewData.rating.toFixed(1)}
        </div>

        {/* Amber accent bar */}
        <div style={{
          height: 2.5,
          background: `linear-gradient(90deg, ${accent}CC, transparent)`,
        }} />

        <div style={{ padding: '10px 14px 13px', position: 'relative' }}>
          {/* Row 1: COURSE REVIEW badge + live score */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(245,158,11,0.12)',
              border: '0.5px solid rgba(245,158,11,0.35)',
              borderRadius: 6,
              padding: '3px 8px',
            }}>
              <span style={{
                fontSize: 8,
                fontWeight: 800,
                color: accent,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
              }}>
                ★ Course Review
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{
                fontSize: 24,
                fontWeight: 900,
                color: accent,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                fontFamily: 'Georgia, serif',
              }}>
                {reviewData.rating.toFixed(1)}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'rgba(245,158,11,0.45)',
              }}>
                /10
              </span>
            </div>
          </div>

          {/* Row 2: Course name — the headline */}
          <div style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            fontFamily: 'Georgia, serif',
            marginBottom: 4,
          }}>
            {reviewData.courseName}
          </div>

          {/* Row 3: Location */}
          {locationStr && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 11 }}>📍</span>
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.38)',
              }}>
                {locationStr}
              </span>
            </div>
          )}

          {/* Divider */}
          <div style={{
            height: 0.5,
            background: `linear-gradient(90deg, rgba(245,158,11,0.3) 0%, transparent 80%)`,
            marginBottom: 10,
          }} />

          {/* Row 4: Reviewer — tappable to navigate to profile */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProfile();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <SquircleAvatar
              size={28}
              src={user?.avatar}
              alt={user?.name ?? 'Creator'}
              fallback={initials}
              hideRing
            />
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
            }}>
              {user?.name || 'Golfer'}
            </span>
          </button>


          {/* Row 5: Review text preview */}
          {captionText && (
            <div style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
              marginBottom: 11,
              fontStyle: 'italic',
            }}>
              "{captionText}"
            </div>
          )}

          {/* Row 6: Read review CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReviewTap?.();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: accent,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.02em' }}>
              Read full review
            </span>
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    );
  })();

  // Regular mode collapsed content
  const regularCollapsedContent = (
    <div className="w-full flex items-center gap-3 px-3 py-2.5">

      {/* Avatar — tappable for profile */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleViewProfile(); }}
        className="flex-shrink-0 active:opacity-70 transition-opacity"
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <SquircleAvatar size={40} src={user?.avatar} alt={user?.name ?? 'Creator'} fallback={initials} hideRing />
      </button>

      {/* Name + caption + course — fills remaining space, taps toggle */}
      <div className="flex-1 min-w-0" onClick={handleToggle} style={{ cursor: 'pointer' }}>
        {/* Name — tappable for profile, stops propagation so it doesn't toggle */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleViewProfile(); }}
          className="active:opacity-70 transition-opacity"
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <span className="text-[13px] font-semibold text-white truncate">
            {user?.name || 'Golfer'}
          </span>
        </button>

        {/* Caption preview (collapsed) */}
        {!isExpanded && truncatedCaption && (
          <div className="text-[11px] text-white/60 line-clamp-1 mt-0.5" style={{ ['--mention-color' as any]: 'rgba(255,255,255,0.75)' }}>
            {tags.length > 0 ? (
              <PostContentWithTags
                content={truncatedCaption}
                tags={tags}
                className="text-[11px] text-white/60 line-clamp-1"
              />
            ) : (
              truncatedCaption
            )}
          </div>
        )}

        {/* Course location (collapsed) — separate line */}
        {!isExpanded && courseDisplayLabel && (
          <div className="flex items-center gap-1 mt-1.5">
            <FiMapPin size={14} className="text-white/50 flex-shrink-0" />
            <span className="text-[11px] text-white/50 truncate">
              {courseDisplayLabel}
            </span>
            {golfCourse?.globalRank && (
              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#F59E0B' }}>
                · #{golfCourse.globalRank} World
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expand/Collapse chevron */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex-shrink-0 p-1 -mr-1 active:opacity-70"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronUp className="w-4 h-4 text-white/50" />
        </motion.div>
      </button>
    </div>
  );

  // Determine border color based on mode
  const borderColor = isReview
    ? 'rgba(245, 158, 11, 0.22)' 
    : 'rgba(255, 255, 255, 0.08)';

  return (
    <>
      {/* Capsule Container - Enhanced glass effect */}
      <motion.div
        ref={capsuleRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          y: isVisible ? 0 : 8 
        }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'fixed z-50',
          'pointer-events-auto',
          // Review mode: narrower, floating with more edge spacing
          isReview 
            ? 'left-4 right-[72px]' 
            : golfCourse?.id
              ? 'left-4 right-[72px]'
              : 'left-4 max-w-[75vw] min-w-[160px]'
        )}
        style={{
          bottom: bottomOffset 
            ? bottomOffset 
            : '117px',
        }}
      >
        {/* Carousel dots — positioned 8px above capsule */}
        {carouselCount > 1 && (
          <div
            className="absolute left-0 right-0 flex justify-center pointer-events-none"
            style={{ bottom: '100%', marginBottom: 8 }}
          >
            <FeedCarouselDots count={carouselCount} activeIndex={carouselActiveIndex} />
          </div>
        )}

        <motion.div
          layout
          transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
          className={cn(
            'overflow-hidden',
            // Both modes use rounded-xl for consistency with ReviewOverlayCore
            'rounded-xl'
          )}
          style={{ 
            background: isReview ? 'rgba(20, 13, 4, 0.95)' : 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${borderColor}`,
            
          }}
        >
          {/* Collapsed State - mode-dependent, crossfade on post change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={postId || 'capsule-content'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {isReview ? reviewContent : regularCollapsedContent}
            </motion.div>
          </AnimatePresence>

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
