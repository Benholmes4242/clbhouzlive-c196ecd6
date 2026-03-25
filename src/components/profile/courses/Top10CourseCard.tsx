/**
 * Top10CourseCard - Apple-style premium card for Top 10 Rated Courses carousel
 * 
 * Features:
 * - Full-bleed hero image with gradient overlay
 * - Frosted glass rank badge (top left)
 * - Frosted glass rating chip (bottom)
 * - Frosted glass reaction strip overlay
 * - 280x360px taller aspect ratio
 * - 24px rounded corners
 * - Layered shadow with press state
 */
import React, { useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { getScoreTier } from '@/utils/getScoreTier';
import { useTopTenReactions, REACTION_CONFIG, ReactionType } from '@/hooks/useTopTenReactions';
import { TopTenCardComments } from './TopTenCardComments';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface Top10CourseCardProps {
  course: TopTenCourse;
  position: number;
  rating?: number;
  className?: string;
  isOwnProfile?: boolean;
  userId?: string;
  privacySetting?: string;
}

export const Top10CourseCard: React.FC<Top10CourseCardProps> = ({
  course,
  position,
  rating,
  className,
  isOwnProfile = true,
  userId,
  privacySetting,
}) => {
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  const { user } = useSupabaseSession();
  const targetUserId = userId ?? '';
  const { counts, myReaction, toggleReaction } = useTopTenReactions(targetUserId, course.course_id);
  
  const handleCardClick = () => {
    setCommentsOpen(true);
  };
  
  // Get tier info for rating display
  const tierData = rating !== undefined ? getScoreTier(rating) : null;
  
  // Location subtitle
  const heroSubtitle = course.sub_country || course.country;

  return (
    <>
      <motion.div
        onClick={handleCardClick}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative w-[227px] h-[292px] rounded-[22px] overflow-hidden flex-shrink-0 cursor-pointer",
          className
        )}
        style={{}}
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
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Rank badge - frosted glass style (top left) */}
        <div 
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span className="text-white font-semibold text-sm">#{position}</span>
        </div>

        {/* Content overlay - bottom (above reaction strip) */}
        <div className="absolute bottom-[40px] left-0 right-0 p-5 pb-2">
          {/* Course name */}
          <h3 
            className="text-white font-semibold text-lg leading-tight mb-1 line-clamp-2"
            style={{
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            }}
          >
            {course.name}
          </h3>
          
          {/* Location */}
          <p 
            className="text-white/70 text-sm mb-3"
            style={{
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {heroSubtitle}
          </p>
          
          {/* Rating chip - frosted glass */}
          {rating !== undefined && tierData && (
            <div 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(245, 158, 11, 0.15)',
              }}
            >
              <span 
                className="font-bold text-lg"
                style={{ color: '#f59e0b' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
              <span 
                className="text-xs font-medium tracking-wide uppercase"
                style={{ color: 'rgba(245, 158, 11, 0.75)' }}
              >
                {tierData.label}
              </span>
            </div>
          )}
        </div>

        {/* Reaction strip — overlaid at bottom of card image */}
        <div
          className="absolute bottom-0 left-0 right-0 flex"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
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
                  if (!isOwnProfile && !!user) toggleReaction(type);
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5
                  transition-all active:scale-95
                  ${isActive ? 'bg-amber-500/25' : 'bg-black/45'}
                  ${!isLast ? 'border-r border-white/[0.08]' : ''}
                  ${isOwnProfile || !user ? 'cursor-default' : 'cursor-pointer'}
                `}
                style={{ backdropFilter: 'blur(12px)' }}
                disabled={isOwnProfile || !user}
              >
                <span className="text-sm">{config.emoji}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold leading-none ${isActive ? 'text-amber-400' : 'text-white/60'}`}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle tap indicator - bottom right */}
        <div className="absolute bottom-[44px] right-5">
          <ChevronRight className="w-5 h-5 text-white/40" />
        </div>
      </motion.div>
      
      {/* Comments sheet */}
      <TopTenCardComments
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        targetUserId={targetUserId}
        courseId={course.course_id}
        courseName={course.name}
        isOwnProfile={isOwnProfile ?? true}
        privacySetting={privacySetting ?? 'followers'}
      />
    </>
  );
};