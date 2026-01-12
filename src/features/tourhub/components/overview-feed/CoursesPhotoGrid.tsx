/**
 * CoursesPhotoGrid - Photo-first course cards from golf_courses DB
 * Each card has course image with minimal overlay
 */

import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import type { FeaturedCourse } from '../../hooks/useTourOverviewData';

interface CoursesPhotoGridProps {
  courses: FeaturedCourse[];
  courseImages?: Map<string, { imageUrl: string | null; name: string }>;
}

export function CoursesPhotoGrid({ courses, courseImages }: CoursesPhotoGridProps) {
  if (!courses.length) return null;

  return (
    <div className="space-y-6">
      {/* Header - standardized */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground tracking-wide">
          Tour Venues
        </h3>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          All venues <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 2-column grid of photo cards */}
      <div className="grid grid-cols-2 gap-3">
        {courses.map((course) => {
          // Try to get image: first from course name lookup, then tournament name, then direct URL
          const resolvedFromName = courseImages?.get(course.name)?.imageUrl;
          const resolvedFromTournament = courseImages?.get(course.tournamentName)?.imageUrl;
          const resolvedImage = resolvedFromName || resolvedFromTournament || course.imageUrl;
          
          return (
            <Link
              key={course.id}
              to={`/tourhub/tournament/${course.id}`}
              className="group relative overflow-hidden rounded-xl aspect-[4/3]"
            >
              {/* Background image or fallback */}
              {resolvedImage ? (
                <img
                  src={resolvedImage}
                  alt={course.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900">
                  {/* Large initials as fallback */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white/10">
                      {course.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                {/* Location pill */}
                <div className="flex items-center gap-1 self-start">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium">
                    <MapPin className="w-2.5 h-2.5" />
                    {course.location || 'USA'}
                  </span>
                </div>
                
                {/* Bottom content */}
                <div>
                  {/* Course name */}
                  <p className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow group-hover:text-white/90 transition-colors">
                    {course.name}
                  </p>
                  
                  {/* Stats chips */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {course.par && (
                      <span className="px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium">
                        Par {course.par}
                      </span>
                    )}
                    {course.yardage && (
                      <span className="px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium">
                        {course.yardage.toLocaleString()}y
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
