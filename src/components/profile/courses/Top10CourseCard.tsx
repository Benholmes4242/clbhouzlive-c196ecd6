/**
 * Top10CourseCard - Crown jewel card for Top 10 Rated Courses carousel
 * 
 * Features:
 * - Overall rating bar (primary)
 * - 4 mini breakdown bars (Design, Condition, Facilities, Experience)
 * - Museum-quality, prestige-led design
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TopTenCourse } from '@/hooks/useUserTopTenCourses';

interface Top10CourseCardProps {
  course: TopTenCourse;
  position: number;
  rating?: number;
  breakdown?: {
    design?: number | null;
    condition?: number | null;
    facilities?: number | null;
    experience?: number | null;
  };
  className?: string;
}

interface RatingBarProps {
  value: number | null | undefined;
  label: string;
  maxValue?: number;
  showLabel?: boolean;
  size?: 'primary' | 'mini';
}

const RatingBar: React.FC<RatingBarProps> = ({
  value,
  label,
  maxValue = 10,
  showLabel = false,
  size = 'mini',
}) => {
  if (value === null || value === undefined) return null;
  
  const percentage = Math.min((value / maxValue) * 100, 100);
  const isPrimary = size === 'primary';
  
  // Prestige-led consistent palette: gold/cream (no value-based switching)
  const barColor = isPrimary 
    ? 'bg-gradient-to-r from-amber-400 to-amber-500' // Gold for overall
    : 'bg-gradient-to-r from-amber-300/70 to-amber-400/70'; // Muted champagne for breakdown

  return (
    <div className="w-full">
      <div 
        className={cn(
          "w-full rounded-full overflow-hidden",
          isPrimary ? "h-1.5 bg-muted/50" : "h-[3px] bg-muted/30"
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className={cn("h-full rounded-full", barColor)}
        />
      </div>
      {showLabel && (
        <span className="text-[9px] text-muted-foreground mt-0.5 block">
          {label}
        </span>
      )}
    </div>
  );
};

export const Top10CourseCard: React.FC<Top10CourseCardProps> = ({
  course,
  position,
  rating,
  breakdown,
  className,
}) => {
  const navigate = useNavigate();
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);
  
  const handleClick = () => {
    navigate(`/courses/${course.course_id}`);
  };

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    // Toggle breakdown visibility on tap/hover
    setShowBreakdown(prev => !prev);
  };

  const hasBreakdown = breakdown && (
    breakdown.design || 
    breakdown.condition || 
    breakdown.facilities || 
    breakdown.experience
  );

  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={() => setShowBreakdown(true)}
      onMouseLeave={() => setShowBreakdown(false)}
      onTouchStart={handleTouch}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-full rounded-none sm:rounded-sq-md overflow-hidden bg-card border-y sm:border border-border/60 cursor-pointer",
        "hover:sm:shadow-md transition-all group",
        className
      )}
    >
      {/* Hero image - matching UnifiedCourseCard aspect ratio */}
      <div className="relative aspect-[1.77/1] overflow-hidden">
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Position badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
          <span className="text-xs font-semibold text-white">#{position}</span>
        </div>
        
        {/* Top 100 badge */}
        {isTop100 && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500/90 flex items-center justify-center shadow-sm">
            <Trophy className="w-3 h-3 text-white" />
          </div>
        )}
        
        {/* Course info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="font-semibold text-white text-sm truncate mb-0.5">
            {course.name}
          </h4>
          <p className="text-white/80 text-xs truncate">
            {course.sub_country || course.country}
          </p>
        </div>
      </div>
      
      {/* Rating bars section - matching UnifiedCourseCard meta area */}
      <div className="px-4 py-3 bg-background space-y-2">
        {/* Primary rating bar */}
        {rating !== undefined && (
          <div className="flex items-center gap-2">
            <RatingBar 
              value={rating} 
              label="Overall" 
              size="primary"
            />
            <span className="text-xs font-semibold text-foreground min-w-[24px] text-right">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
        
        {/* Mini breakdown bars - shown on hover/tap */}
        <AnimatePresence>
          {hasBreakdown && showBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1.5 pt-1 border-t border-border/30"
            >
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {breakdown.design !== null && breakdown.design !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground w-12">Design</span>
                    <div className="flex-1">
                      <RatingBar value={breakdown.design} label="Design" size="mini" />
                    </div>
                  </div>
                )}
                {breakdown.condition !== null && breakdown.condition !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground w-12">Condition</span>
                    <div className="flex-1">
                      <RatingBar value={breakdown.condition} label="Condition" size="mini" />
                    </div>
                  </div>
                )}
                {breakdown.facilities !== null && breakdown.facilities !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground w-12">Facilities</span>
                    <div className="flex-1">
                      <RatingBar value={breakdown.facilities} label="Facilities" size="mini" />
                    </div>
                  </div>
                )}
                {breakdown.experience !== null && breakdown.experience !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground w-12">Experience</span>
                    <div className="flex-1">
                      <RatingBar value={breakdown.experience} label="Experience" size="mini" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hint removed for premium feel - breakdown appears on hover/tap */}
      </div>
    </motion.div>
  );
};
