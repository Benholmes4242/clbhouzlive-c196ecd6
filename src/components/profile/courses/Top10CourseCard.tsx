/**
 * Top10CourseCard - Crown jewel card for Top 10 Rated Courses carousel
 * 
 * Features:
 * - Updated ranking badges with new Outstanding amber color (#F59E0B)
 * - Hero treatment for #1 position with "Your #1" badge
 * - Trophy icons for top 3 only
 * - Overall rating bar (primary) with tier-based colors
 * - 4 mini breakdown bars (Design, Condition, Facilities, Experience)
 * - Tier label as gradient text (no pill) matching Community Rating style
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
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

// Medal colors for ranking badges - #1 uses Outstanding amber gradient
const getRankingBadgeStyle = (position: number): { 
  bg: string; 
  text: string; 
  shadow?: string;
  size: string;
} => {
  switch (position) {
    case 1:
      // Gold - Outstanding amber gradient (matching tier label gradient)
      return { 
        bg: 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 100%)', 
        text: '#FFFFFF',
        shadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
        size: 'w-8 h-8 text-sm',
      };
    case 2:
      // Silver
      return { 
        bg: 'linear-gradient(145deg, #94A3B8 0%, #64748B 100%)', 
        text: '#FFFFFF',
        shadow: '0 2px 6px rgba(100, 116, 139, 0.35)',
        size: 'w-7 h-7 text-sm',
      };
    case 3:
      // Bronze
      return { 
        bg: 'linear-gradient(145deg, #D97706 0%, #B45309 100%)', 
        text: '#FFFFFF',
        shadow: '0 2px 6px rgba(217, 119, 6, 0.35)',
        size: 'w-7 h-7 text-sm',
      };
    default:
      // Slate grey
      return { 
        bg: '#F1F5F9', 
        text: '#475569',
        shadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
        size: 'w-6 h-6 text-xs',
      };
  }
};


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
  
  // Color scheme: breakdown bars always slate, primary bar uses amber only for Outstanding
  const tierData = getScoreTier(value);
  const isOutstanding = tierData.tier === 'outstanding';
  // Breakdown bars (mini) = always slate, Primary bar = amber for outstanding, slate otherwise
  const barColor = isPrimary && isOutstanding ? '#F59E0B' : '#64748b';
  
  return (
    <div className="w-full">
      {/* Title row - label above, tier text on right for primary (no pill) */}
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "text-muted-foreground",
          isPrimary ? "text-[10px] font-medium" : "text-[9px]"
        )}>
          {label}
        </span>
        {isPrimary && showBadge && (
          <span 
            className={cn(
              "text-[9px] font-semibold uppercase tracking-wide",
              isOutstanding 
                ? "bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent" 
                : "bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af] bg-clip-text text-transparent"
            )}
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
  const isHeroCard = position === 1;
  
  const handleClick = () => {
    navigate(`/courses/${course.course_id}`);
  };

  const hasBreakdown = breakdown && (
    breakdown.design || 
    breakdown.condition || 
    breakdown.facilities || 
    breakdown.experience
  );

  const badgeStyle = getRankingBadgeStyle(position);

  return (
    <motion.div
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-full rounded-xl overflow-hidden bg-white border border-[#e2e8f0] cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
        "hover:shadow-md transition-all group",
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
        
        {/* Ranking badge - new medal-style design */}
        <div 
          className={cn(
            "absolute top-3 left-3 rounded-full flex items-center justify-center font-bold",
            badgeStyle.size
          )}
          style={{
            background: badgeStyle.bg,
            color: badgeStyle.text,
            boxShadow: badgeStyle.shadow,
          }}
        >
          {position}
        </div>
        
        {/* Hero Badge for #1 */}
        {isHeroCard && (
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold uppercase tracking-wide rounded-full shadow-sm">
            Your #1
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
