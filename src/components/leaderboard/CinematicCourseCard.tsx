import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseRankBadge } from './CourseRankBadge';
import { CourseCommunityRating } from '@/components/courses/CourseCommunityRating';

interface CinematicCourseCardProps {
  course: {
    course_id: string;
    course_name: string;
    country: string;
    sub_country?: string | null;
    thumbnail_image?: string | null;
    global_rank?: number | null;
    regional_rank?: number | null;
    usa_rank?: number | null;
    avg_rating?: number | null;
    times_played?: number;
    ratings_count?: number;
    friends_count?: number;
  };
  listPosition: number;
  showFriendsContext?: boolean;
  className?: string;
}

/**
 * CINEMATIC COURSE CARD
 * 
 * Image-first, editorial gallery tile
 * Design principles:
 * - Aspect ratio 4:5 (taller, cinematic)
 * - No dark overlays, subtle slate tint only
 * - Rank badges top-left
 * - Flair badge top-right (optional)
 * - Subtle zoom on hover
 * - Staggered fade-in animation
 */
export function CinematicCourseCard({ 
  course, 
  listPosition,
  showFriendsContext = false,
  className 
}: CinematicCourseCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.course_id}`);
  };

  // Determine if course qualifies for flair badge
  const getFlairBadge = () => {
    if (course.global_rank && course.global_rank <= 10) {
      return { rank: course.global_rank, region: 'global' };
    }
    if (course.usa_rank && course.usa_rank <= 10) {
      return { rank: course.usa_rank, region: 'usa' };
    }
    if (course.regional_rank && course.regional_rank <= 10) {
      const gbCountries = ['England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland', 'Britain & Ireland'];
      if (gbCountries.includes(course.country)) {
        return { rank: course.regional_rank, region: 'gb-i' };
      }
      return { rank: course.regional_rank, region: 'europe' };
    }
    return null;
  };

  const flairBadge = getFlairBadge();
  const locationText = course.sub_country 
    ? `${course.sub_country}, ${course.country}`
    : course.country;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full overflow-hidden bg-card text-left',
        'border-b border-border/40',
        'hover:bg-muted/30 transition-colors duration-200',
        'animate-fadeIn',
        className
      )}
      style={{ animationDelay: `${listPosition * 50}ms` }}
    >
      {/* Hero Image - wider aspect ratio (reduced height by ~50%) */}
      <div className="relative w-full aspect-[16/9] overflow-hidden group">
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.course_name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 mx-auto rounded-sq-sm bg-slate-200/60 flex items-center justify-center">
                <Image className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">No image</span>
            </div>
          </div>
        )}

        {/* Very subtle slate tint - NO dark overlays */}
        <div className="absolute inset-0 bg-slate-900/5 pointer-events-none" />

        {/* Rank Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {course.global_rank && (
            <CourseRankBadge rank={course.global_rank} region="global" />
          )}
          {course.usa_rank && !course.global_rank && (
            <CourseRankBadge rank={course.usa_rank} region="usa" />
          )}
          {course.regional_rank && !course.global_rank && !course.usa_rank && (
            <CourseRankBadge 
              rank={course.regional_rank} 
              region={
                ['England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland'].includes(course.country) 
                  ? 'gb-i' 
                  : 'europe'
              } 
            />
          )}
        </div>

        {/* Flair Badge - Top Right (optional) */}
        {flairBadge && (
          <div className="absolute top-3 right-3">
            <CourseRankBadge 
              rank={flairBadge.rank} 
              region={flairBadge.region} 
              variant="flair" 
            />
          </div>
        )}
      </div>

      {/* Metadata Block - Below Image */}
      <div className="px-4 py-3.5 bg-white space-y-1">
        {/* Course Name */}
        <h3 className="text-sm font-semibold text-foreground truncate">
          {course.course_name}
        </h3>

        {/* Location */}
        <p className="text-xs text-muted-foreground truncate">
          {locationText}
        </p>

        {/* Rating Line - using CourseCommunityRating with clubhouse logo */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {course.avg_rating ? (
            <CourseCommunityRating rating={course.avg_rating} size="lg" />
          ) : (
            <span className="text-[13px] font-medium text-muted-foreground">—</span>
          )}
          {course.ratings_count && course.ratings_count > 0 && (
            <span className="text-xs text-muted-foreground">
              • Rated by {course.ratings_count} member{course.ratings_count === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Friends Context (optional) */}
        {showFriendsContext && course.friends_count && course.friends_count > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {course.friends_count} friend{course.friends_count === 1 ? '' : 's'} played
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
