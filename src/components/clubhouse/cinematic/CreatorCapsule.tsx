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
import { ChevronUp, User, Music, ChevronRight, MapPin } from 'lucide-react';
import { FiMapPin } from 'react-icons/fi';
import { getProfilePathById } from '@/lib/profileRoutes';
import { getActorRouteByType } from '@/types/actor';
import { CourseDNACard } from './CourseDNACard';

import { type ExtractedReviewData } from '@/lib/postHelpers';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import PostContentWithTags from '@/components/posts/PostContentWithTags';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { FROST, FROST_BLUR, FROST_SCORE_GRADIENT, formatFrostRating, splitCourseName } from '@/lib/frostPanel';

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
    /** Actor type for the post — determines profile route on tap. Defaults to 'personal'. */
    actorType?: 'personal' | 'business';
    /** Actor id (business id when actorType === 'business'). Falls back to user.id. */
    actorId?: string;
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
      // Use actor info if supplied, otherwise fall back to legacy personal route
      const path = user.actorType
        ? getActorRouteByType(user.actorType, user.actorId ?? user.id)
        : getProfilePathById(user.id);
      navigate(path);
    }
  }, [navigate, onViewProfile, onBeforeNavigate, user.id, user.actorType, user.actorId]);

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
          prefetchedData={
            golfCourse.latitude || golfCourse.thumbnailImage
              ? {
                  thumbnailImage: golfCourse.thumbnailImage ?? null,
                  latitude: golfCourse.latitude ?? null,
                  longitude: golfCourse.longitude ?? null,
                  globalRank: golfCourse.globalRank ?? null,
                }
              : null
          }
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

  // Review mode content — Frost Panel (PR 2 visual redesign)
  const reviewContent = reviewData && (() => {
    const tierLabel = getRatingTierLabel(reviewData.rating);
    const formattedRating = formatFrostRating(reviewData.rating);
    const { name: titleName, subtitle: derivedSubtitle } = splitCourseName(reviewData.courseName);

    return (
      <div
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onReviewTap?.();
        }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '16px 16px 14px',
          color: FROST.ink,
          fontFamily: 'Geist, system-ui, sans-serif',
          cursor: 'pointer',
        }}
      >
        {/* Decorative amber glow orb */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -40,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: FROST.amberGlow,
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />

        {/* Tier pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px 4px 8px',
            background: FROST.amberTint,
            border: `1px solid ${FROST.amberBorder}`,
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: FROST.amberSoft,
            marginBottom: 10,
            position: 'relative',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: FROST.amber,
              boxShadow: '0 0 8px rgba(247,147,30,0.8)',
            }}
          />
          {tierLabel}
        </div>

        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            position: 'relative',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-0.4px',
                lineHeight: 1.05,
                color: FROST.ink,
                wordBreak: 'break-word',
              }}
            >
              {titleName}
            </div>
            {derivedSubtitle && (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  fontWeight: 500,
                  color: FROST.inkMute,
                  lineHeight: 1.2,
                }}
              >
                {derivedSubtitle}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 2,
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: '-1.6px',
                lineHeight: 0.85,
                ...FROST_SCORE_GRADIENT,
              }}
            >
              {formattedRating}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: FROST.inkFaint }}>/10</span>
          </div>
        </div>

        {/* Author row */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile();
          }}
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            position: 'relative',
            minWidth: 0,
          }}
        >
          <SquircleAvatar
            size={20}
            src={user?.avatar}
            alt={user?.name ?? 'Creator'}
            fallback={initials}
            hideRing
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: FROST.ink,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.name || 'Golfer'}
          </span>
        </button>
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
        <SquircleAvatar size={40} src={user?.avatar} alt={user?.name ?? 'Creator'} userId={user?.id} hairlineRing ringColor="rgba(255,255,255,0.95)" />
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
          <div className="text-[11px] text-white line-clamp-1 mt-0.5" style={{ ['--mention-color' as any]: 'rgba(255,255,255,0.75)' }}>
            {tags.length > 0 ? (
              <PostContentWithTags
                content={truncatedCaption}
                tags={tags}
                className="text-[11px] text-white line-clamp-1"
              />
            ) : (
              truncatedCaption
            )}
          </div>
        )}

        {/* Course location (collapsed) — separate line */}
        {!isExpanded && courseDisplayLabel && (
          <div className="flex items-center gap-1 mt-1.5">
            <FiMapPin size={14} className="flex-shrink-0" style={{ color: '#ffffff' }} />
            <span className="text-[11px] truncate" style={{ color: '#ffffff' }}>
              {courseDisplayLabel}
            </span>
            {golfCourse?.globalRank && (
              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#ffffff' }}>
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
            isReview ? 'rounded-3xl' : 'rounded-xl'
          )}
          style={{
            background: isReview ? FROST.glass : 'rgba(0, 0, 0, 0.35)',
            backdropFilter: isReview ? FROST_BLUR.panel : 'blur(20px)',
            WebkitBackdropFilter: isReview ? FROST_BLUR.panel : 'blur(20px)',
            border: `1px solid ${isReview ? FROST.border : borderColor}`,
            boxShadow: isReview ? `${FROST.dropShadow}, ${FROST.innerHighlight}` : undefined,
            transform: isReview ? 'translateZ(0)' : undefined,
            willChange: isReview ? 'backdrop-filter' : undefined,
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
