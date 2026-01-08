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
    navigate(`/courses/${displayCourse.id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative w-full aspect-[16/10] sm:aspect-[2.2/1] overflow-hidden group cursor-pointer"
    >
      {/* Background Image */}
      <img
        src={displayCourse.imageUrl}
        alt={displayCourse.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
      />

      {/* Very subtle slate tint - light mode optimized, NO gradients */}
      <div className="absolute inset-0 bg-slate-500/10" />

      {/* Frosted glass panel for content - NO gradient overlays */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="rounded-sq-sm border border-white/40 bg-white/75 backdrop-blur-md shadow-sm p-3.5 sm:p-4">
          {/* Label pill */}
          <div className="mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-sq-pill border border-slate-200/60">
              <Trophy className="w-3 h-3 text-amber-500" />
              {label}
            </span>
          </div>

          {/* Course name */}
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-tight mb-1">
            {displayCourse.name}
          </h2>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-slate-600 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{displayCourse.location}</span>
          </div>

          {/* Rank badges */}
          <div className="flex items-center gap-2">
            {displayCourse.globalRank && (
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-sq-xs border border-slate-200/80 shadow-sm">
                #{displayCourse.globalRank} Global
              </span>
            )}
            {displayCourse.regionalRank && displayCourse.region && (
              <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-sq-xs border border-slate-200/60">
                #{displayCourse.regionalRank} {displayCourse.region}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
