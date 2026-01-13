import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Top100RankBadge } from '@/components/top100/Top100RankBadge';

interface CourseLeaderboardHeroProps {
  course?: {
    id: string;
    name: string;
    location: string;
    imageUrl: string;
    globalRank?: number;
    regionalRank?: number;
    region?: string;
  };
  label?: string;
}

/**
 * CINEMATIC COURSE HERO
 * 
 * Full-width, editorial-style hero for "#1 Most Played"
 * Design principles:
 * - No heavy gradients
 * - Very subtle slate tint overlay
 * - Text always readable
 * - Premium, prestige feel
 * - Smooth image loading transition
 */
export function CourseLeaderboardHero({ 
  course,
  label = "#1 Most Played" 
}: CourseLeaderboardHeroProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Default featured course if none provided
  const defaultCourse: CourseLeaderboardHeroProps['course'] = {
    id: 'cypress-point',
    name: 'Cypress Point Club',
    location: 'Monterey Peninsula, California',
    imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&auto=format&fit=crop&q=80',
    globalRank: 1,
    region: 'USA',
    regionalRank: undefined
  };

  const displayCourse = course || defaultCourse;

  const handleClick = () => {
    navigate(`/courses/${displayCourse.id}`);
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
      className="relative w-full aspect-[16/10] sm:aspect-[2.2/1] overflow-hidden group cursor-pointer active:scale-[0.995] transition-transform duration-150"
    >
      {/* Background Image with smooth loading */}
      <div className={cn(
        "absolute inset-0 bg-muted transition-opacity duration-500",
        imageLoaded ? "opacity-0" : "opacity-100"
      )} />
      <img
        src={displayCourse.imageUrl}
        alt={displayCourse.name}
        onLoad={() => setImageLoaded(true)}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out",
          "group-hover:scale-[1.02]",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Very subtle slate tint - light mode optimized, NO gradients */}
      <div className="absolute inset-0 bg-slate-500/10" />

      {/* Frosted glass panel for content */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <div className="rounded-sq-sm border border-white/50 bg-white/80 backdrop-blur-md shadow-lg p-4 sm:p-5 transition-transform duration-200 group-hover:translate-y-[-2px]">
          {/* Label pill */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-sq-pill border border-slate-200/80 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              {label}
            </span>
          </div>

          {/* Course name */}
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 leading-tight mb-1.5">
            {displayCourse.name}
          </h2>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-slate-600 text-sm sm:text-base mb-3.5">
            <MapPin className="w-4 h-4" />
            <span>{displayCourse.location}</span>
          </div>

          {/* Rank badges - using unified Top100RankBadge */}
          <div className="flex items-center gap-2">
            {displayCourse.globalRank && (
              <Top100RankBadge listSlug="global" rank={displayCourse.globalRank} />
            )}
            {displayCourse.regionalRank && displayCourse.region && (
              <Top100RankBadge 
                listSlug={displayCourse.region === 'USA' ? 'usa' : displayCourse.region === 'GB & Ireland' ? 'gb-i' : 'europe'} 
                rank={displayCourse.regionalRank} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}