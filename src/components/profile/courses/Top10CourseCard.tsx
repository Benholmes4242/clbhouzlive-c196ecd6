/**
 * Top10CourseCard - Crown jewel card for Top 10 Rated Courses carousel
 * 
 * Features:
 * - Overall rating bar (primary) with tier-based colors
 * - 4 mini breakdown bars (Design, Condition, Facilities, Experience)
 * - Uses global color system (Fair → Outstanding)
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { getScoreTier } from '@/utils/getScoreTier';

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
  size?: 'primary' | 'mini';
  showBadge?: boolean;
}

const RatingBar: React.FC<RatingBarProps> = ({
  value,
  label,
  maxValue = 10,
  size = 'mini',
  showBadge = false,
}) => {
  if (value === null || value === undefined) return null;
  
  const percentage = Math.min((value / maxValue) * 100, 100);
  const isPrimary = size === 'primary';
  
  // Color scheme: breakdown bars always slate, primary bar uses gold only for Outstanding
  const tierData = getScoreTier(value);
  const isOutstanding = tierData.tier === 'outstanding';
  // Breakdown bars (mini) = always slate, Primary bar = gold for outstanding, slate otherwise
  const barColor = isPrimary && isOutstanding ? '#C9A94A' : '#64748b';
  
  return (
    <div className="w-full">
      {/* Title row - label above, badge on right for primary */}
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "text-muted-foreground",
          isPrimary ? "text-[10px] font-medium" : "text-[9px]"
        )}>
          {label}
        </span>
        {isPrimary && showBadge && (
          <span 
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ 
              backgroundColor: tierData.bgLight,
              color: '#1e293b'
            }}
          >
            {tierData.label}
          </span>
        )}
      </div>
      
      {/* Bar row - bar with score at end */}
      <div className="flex items-center gap-1.5 w-full">
        <div 
          className={cn(
            "flex-1 rounded-full overflow-hidden",
            isPrimary ? "h-1.5 bg-slate-200" : "h-[3px] bg-slate-200"
          )}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: barColor }}
          />
        </div>
        <span className={cn(
          "text-muted-foreground min-w-[20px] text-right",
          isPrimary ? "text-xs font-semibold" : "text-[9px]"
        )}>
          {value.toFixed(1)}
        </span>
      </div>
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
  
  const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);
  
  const handleClick = () => {
    navigate(`/courses/${course.course_id}`);
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
      {/* Primary rating bar with badge */}
        {rating !== undefined && (
          <RatingBar 
            value={rating} 
            label="Overall Rating" 
            size="primary"
            showBadge
          />
        )}
        
        {/* Mini breakdown bars - 2x2 grid, always visible */}
        {hasBreakdown && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border/30">
            {breakdown.design !== null && breakdown.design !== undefined && (
              <RatingBar value={breakdown.design} label="Design" size="mini" />
            )}
            {breakdown.condition !== null && breakdown.condition !== undefined && (
              <RatingBar value={breakdown.condition} label="Condition" size="mini" />
            )}
            {breakdown.facilities !== null && breakdown.facilities !== undefined && (
              <RatingBar value={breakdown.facilities} label="Facilities" size="mini" />
            )}
            {breakdown.experience !== null && breakdown.experience !== undefined && (
              <RatingBar value={breakdown.experience} label="Experience" size="mini" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
