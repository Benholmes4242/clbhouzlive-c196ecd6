import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy } from 'lucide-react';

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
 * Full-width, editorial-style hero for "Course of the Week"
 * Design principles:
 * - No heavy gradients
 * - Very subtle slate tint overlay
 * - Text always readable
 * - Premium, prestige feel
 */
export function CourseLeaderboardHero({ 
  course,
  label = "Course of the Week" 
}: CourseLeaderboardHeroProps) {
  const navigate = useNavigate();

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
    if (displayCourse.id !== 'cypress-point') {
      navigate(`/courses/${displayCourse.id}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative w-full aspect-[16/10] sm:aspect-[2.2/1] rounded-sq-md overflow-hidden group cursor-pointer"
    >
      {/* Background Image */}
      <img
        src={displayCourse.imageUrl}
        alt={displayCourse.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
      />

      {/* Very subtle slate tint - light mode optimized, never "black" */}
      <div className="absolute inset-0 bg-slate-600/15" />
      
      {/* Bottom gradient for text readability - warm slate, not dark */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-700/50 via-slate-600/20 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
        {/* Label pill */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase text-white/90 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-sq-pill border border-white/10">
            <Trophy className="w-3 h-3" />
            {label}
          </span>
        </div>

        {/* Course name */}
        <h2 className="text-xl sm:text-2xl font-semibold text-white leading-tight mb-1.5">
          {displayCourse.name}
        </h2>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-white/80 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{displayCourse.location}</span>
        </div>

        {/* Rank badges */}
        <div className="flex items-center gap-2">
          {displayCourse.globalRank && (
            <span className="text-[11px] font-medium text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-sq-xs border border-white/10">
              #{displayCourse.globalRank} Global
            </span>
          )}
          {displayCourse.regionalRank && displayCourse.region && (
            <span className="text-[11px] font-medium text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-sq-xs border border-white/10">
              #{displayCourse.regionalRank} {displayCourse.region}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
