/**
 * Top10CourseCard - Crown jewel card for Top 10 Rated Courses carousel
 * 
 * Features:
 * - Ranking badge (medal style) on top left
 * - Rating capsule (top right) matching review post overlay style
 * - Overall rating bar below image
 * - Clean design without breakdown bars
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
  className?: string;
  isOwnProfile?: boolean;
}

 // Medal colors for ranking badges - #1 uses Chartreus gold
const getRankingBadgeStyle = (position: number): { 
  bg: string; 
  text: string; 
  shadow?: string;
  size: string;
} => {
  switch (position) {
    case 1:
       // Amber/Gold for #1
      return { 
         bg: '#f59e0b', 
        text: '#FFFFFF',
         shadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
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

export const Top10CourseCard: React.FC<Top10CourseCardProps> = ({
  course,
  position,
  rating,
  className,
  isOwnProfile = true,
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/courses/${course.course_id}`);
  };

  const badgeStyle = getRankingBadgeStyle(position);
  
  // Get tier info for rating display
  const tierData = rating !== undefined ? getScoreTier(rating) : null;
  const isOutstanding = tierData?.tier === 'outstanding';

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
        
        {/* Ranking badge - medal-style design (top left) */}
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
      
      {/* Rating bar section - overall only */}
      {rating !== undefined && tierData && (
        <div className="px-4 py-3 bg-background">
          <div className="w-full">
            {/* Title row */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">
                {isOwnProfile ? "Your Rating" : "Their Rating"}
              </span>
              <span 
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wide",
                  isOutstanding 
                   ? "text-[#d97706]" 
                   : "text-[#6b7280]"
                )}
              >
                {tierData.label}
              </span>
            </div>
            
            {/* Bar row */}
            <div className="flex items-center gap-1.5 w-full">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(rating / 10) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                  className={cn(
                    "h-full rounded-full",
                    isOutstanding ? "bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" : "bg-[#d1d5db]"
                  )}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground min-w-[20px] text-right">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
