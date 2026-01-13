import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Image, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Top100RankBadge, type Top100RankBadgeProps } from '@/components/top100/Top100RankBadge';
import { CourseCommunityRating } from '@/components/courses/CourseCommunityRating';
import { haptic } from '@/utils/haptics';

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
  /** V3: Count of active games at this course (for badge) */
  activeGamesCount?: number;
  /** V3: Callback to open Games Hub with this course pre-selected */
  onCreateGame?: (course: { id: string; name: string; country: string }) => void;
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
  className,
  activeGamesCount = 0,
  onCreateGame,
}: CinematicCourseCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.course_id}`);
  };

  const handleCreateGame = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('light');
    onCreateGame?.({
      id: course.course_id,
      name: course.course_name,
      country: course.country,
    });
  };

  const locationText = course.sub_country 
    ? `${course.sub_country}, ${course.country}`
    : course.country;

  // Map region string to listSlug for Top100RankBadge
  const getListSlug = (region: string): Top100RankBadgeProps['listSlug'] => {
    const gbCountries = ['England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland', 'Britain & Ireland'];
    if (gbCountries.includes(region)) return 'gb-i';
    if (region === 'usa' || region === 'USA') return 'usa';
    if (region === 'europe') return 'europe';
    return 'global';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'w-full overflow-hidden bg-card text-left cursor-pointer',
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

        {/* Rank Badges - Top Left (unified with Explore page) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {/* Global rank first if available */}
          {course.global_rank && (
            <Top100RankBadge listSlug="global" rank={course.global_rank} />
          )}
          {/* Regional rank (USA, GB&I, Europe) - show alongside global if both exist */}
          {course.usa_rank && (
            <Top100RankBadge listSlug="usa" rank={course.usa_rank} />
          )}
          {course.regional_rank && (
            <Top100RankBadge 
              listSlug={getListSlug(course.country)} 
              rank={course.regional_rank}
            />
          )}
        </div>
      </div>

      {/* Metadata Block - Below Image */}
      <div className="px-4 py-3.5 bg-white space-y-1">
        {/* Course Name + Active Games Badge Row */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate flex-1">
            {course.course_name}
          </h3>
          
          {/* V3: Active Games Badge */}
          {activeGamesCount > 0 && (
            <button
              onClick={handleCreateGame}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <Users className="w-3 h-3" />
              {activeGamesCount} {activeGamesCount === 1 ? 'game' : 'games'}
            </button>
          )}
        </div>

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

        {/* V3: Create Game CTA */}
        {onCreateGame && (
          <button
            onClick={handleCreateGame}
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-full justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            Create game here
          </button>
        )}
      </div>
    </div>
  );
}
