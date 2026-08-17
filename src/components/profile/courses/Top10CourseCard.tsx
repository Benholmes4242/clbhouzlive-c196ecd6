/**
 * Top10CourseCard - Apple-style premium card for Top 10 Rated Courses carousel
 * 
 * Features:
 * - Full-bleed hero image with gradient overlay
 * - Frosted glass rank chip (top left) — number only, no crown glyph
 * - Frosted glass rating chip (bottom)
 * - Frosted glass reaction strip overlay
 * - 280x360px taller aspect ratio
 * - 4px rounded corners (matches watch video tiles)
 * - Layered shadow with press state
 */
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { getScoreTier } from '@/utils/getScoreTier';
import { useTopTenReactions, REACTION_CONFIG, ReactionType } from '@/hooks/useTopTenReactions';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';

interface Top10CourseCardProps {
  course: TopTenCourse;
  position: number;
  rating?: number;
  className?: string;
  isOwnProfile?: boolean;
  userId?: string;
  privacySetting?: string;
  /** Deep-link: auto-open the comments sheet and scroll to this comment id. */
  initialCommentId?: string | null;
  initialParentCommentId?: string | null;
}

export const Top10CourseCard: React.FC<Top10CourseCardProps> = ({
  course,
  position,
  rating,
  className,
  isOwnProfile = true,
  userId,
  privacySetting,
  initialCommentId = null,
  initialParentCommentId = null,
}) => {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [tappedReaction, setTappedReaction] = useState<string | null>(null);

  const { user } = useSupabaseSession();
  const targetUserId = userId ?? '';
  const { counts, myReaction, toggleReaction } = useTopTenReactions(targetUserId, course.course_id);

  // Auto-open the sheet when this card is the deep-link target (Item 2B).
  const didAutoOpen = React.useRef(false);
  React.useEffect(() => {
    if (didAutoOpen.current) return;
    if (!initialCommentId) return;
    didAutoOpen.current = true;
    setCommentsOpen(true);
  }, [initialCommentId]);

  const handleCardClick = () => {
    setCommentsOpen(true);
  };
  
  // Get tier info for rating display
  const tierData = rating !== undefined ? getScoreTier(rating) : null;
  
  // Location subtitle
  const heroSubtitle = course.sub_country || course.country;

  const rankStyle: React.CSSProperties =
    position <= 3
      ? { background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)' }
      : { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' };


  return (
    <>
      <motion.div
        onClick={handleCardClick}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative w-[210px] h-[269px] rounded-[4px] overflow-hidden flex-shrink-0 cursor-pointer",
          className
        )}
        style={{
          boxShadow: 'none',
        }}
      >
        {/* Background image - full bleed */}
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-white/40" />
          </div>
        )}

        {/* Gradient overlay for text legibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: SCRIM_STANDOUT,
          }}
        />

        {/* Rank badge - frosted glass style (top left) */}
        <div 
          className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            ...rankStyle,
          }}
        >
          {/* No crown glyph — the rank number is the whole statement. */}
          <span className="text-white font-bold text-[12px]">#{position}</span>
        </div>

        {/* Content overlay - bottom (above reaction strip) */}
        <div className="absolute bottom-[47px] left-0 right-0 px-3 pb-2.5 pt-6">
          {/* Course name */}
          <h3 
            className="text-white font-semibold text-lg leading-tight mb-0.5 line-clamp-2"
            style={{
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            }}
          >
            {course.name}
          </h3>
          
          {/* Location */}
          <p 
            className="text-white/70 text-[13px] mb-2 line-clamp-1"
            style={{
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {heroSubtitle}
          </p>
          
          {/* Rating chip - frosted glass */}
          {rating !== undefined && tierData && (
            <div 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.28)',
              }}
            >
              <span 
                className="font-bold text-[13px]"
                style={{ color: '#FFFFFF' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
              <span 
                className="text-[10px] font-medium tracking-wide uppercase"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {tierData.label}
              </span>
            </div>
          )}
        </div>

        {/* Reaction strip — overlaid at bottom of card image */}
        <div
          className="absolute bottom-0 left-0 right-0 flex h-[47px] glass-dark !rounded-none !rounded-b-[4px] !border-t-[1px] !border-t-white/[0.06] !border-b-0 !border-x-0"
        >
          {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(([type, config], idx) => {
            const count = counts[type] ?? 0;
            const isActive = myReaction === type;
            const isLast = idx === Object.keys(REACTION_CONFIG).length - 1;
            return (
              <button
                key={type}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOwnProfile && !!user) {
                    setTappedReaction(type);
                    setTimeout(() => setTappedReaction(null), 400);
                    toggleReaction(type);
                  }
                }}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5
                  transition-all active:scale-95
                  ${isActive ? 'bg-amber-500/25' : ''}
                  ${!isLast ? 'border-r border-white/[0.08]' : ''}
                  ${isOwnProfile || !user ? 'cursor-default' : 'cursor-pointer'}
                `}
                disabled={isOwnProfile || !user}
              >
                <motion.span
                  key={isActive ? 'active' : 'inactive'}
                  initial={{ scale: 1 }}
                  animate={tappedReaction === type ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="text-[13px] leading-none"
                >
                  {config.emoji}
                </motion.span>
                {count > 0 && (
                  <span className={`text-[9px] font-bold leading-none ${isActive ? 'text-amber-400' : 'text-white/60'}`}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                {tappedReaction === type && (
                  <AnimatePresence>
                    {[...Array(4)].map((_, i) => {
                      const angle = (i / 4) * 360;
                      const rad = (angle * Math.PI) / 180;
                      const x = Math.cos(rad) * 12;
                      const y = Math.sin(rad) * 12;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                          animate={{ opacity: 0, x, y, scale: 0.3 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="absolute w-1 h-1 rounded-full bg-amber-400 pointer-events-none"
                          style={{ top: '50%', left: '50%', marginTop: -2, marginLeft: -2 }}
                        />
                      );
                    })}
                  </AnimatePresence>
                )}
              </button>
            );
          })}
        </div>

      </motion.div>
      
      {/* Comments sheet */}
      <CommentsSheetV2
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        targetType="top_ten"
        targetId={targetUserId}
        targetSecondaryId={course.course_id}
        initialCommentId={initialCommentId}
      />

    </>
  );
};