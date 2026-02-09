/**
 * FeaturedCoursesDestination - Destination-style course cards with unique palettes
 */

import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import type { FeaturedCourse } from '../../hooks/useTourOverviewData';

interface FeaturedCoursesDestinationProps {
  courses: FeaturedCourse[];
}

// Unique gradient + texture combinations for each card
const destinationStyles = [
  {
    gradient: 'from-emerald-600/20 via-teal-500/15 to-cyan-500/10',
    accent: 'text-emerald-700 dark:text-emerald-400',
    pattern: 'M0 50 Q50 30 100 50 T200 50',
  },
  {
    gradient: 'from-blue-600/20 via-indigo-500/15 to-violet-500/10',
    accent: 'text-blue-700 dark:text-blue-400',
    pattern: 'M0 40 Q50 60 100 40 T200 40',
  },
  {
    gradient: 'from-amber-600/20 via-orange-500/15 to-rose-500/10',
    accent: 'text-amber-700 dark:text-amber-400',
    pattern: 'M0 60 Q50 40 100 60 T200 60',
  },
  {
    gradient: 'from-purple-600/20 via-pink-500/15 to-rose-500/10',
    accent: 'text-purple-700 dark:text-purple-400',
    pattern: 'M0 45 Q50 55 100 45 T200 45',
  },
];

export function FeaturedCoursesDestination({ courses }: FeaturedCoursesDestinationProps) {
  if (!courses.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-foreground text-lg">Featured Courses</h3>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1 transition-colors"
        >
          All venues <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {courses.map((course, idx) => {
          const style = destinationStyles[idx % destinationStyles.length];
          
          return (
            <Link
              key={course.id}
              to={`/tourhub/tournament/${course.id}`}
              className="group relative overflow-hidden rounded-xl border border-border hover:border-primary/40 hover:shadow-lg transition-all"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />
              
              {/* Contour texture */}
              <div className="absolute inset-0 opacity-[0.08]">
                <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
                  <path d={style.pattern} fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <path d={style.pattern} fill="none" stroke="currentColor" strokeWidth="0.3" transform="translate(0, 20)" />
                  <path d={style.pattern} fill="none" stroke="currentColor" strokeWidth="0.3" transform="translate(0, -20)" />
                  <circle cx="160" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                  <circle cx="160" cy="30" r="30" fill="none" stroke="currentColor" strokeWidth="0.2" />
                  <circle cx="40" cy="90" r="15" fill="none" stroke="currentColor" strokeWidth="0.3" />
                </svg>
              </div>
              
              {/* Image overlay (future-ready) */}
              {course.imageUrl && (
                <>
                  <img 
                    src={course.imageUrl} 
                    alt={course.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </>
              )}
              
              <div className="relative p-4 min-h-[120px] flex flex-col">
                {/* Location Pin */}
                <div className={`flex items-center gap-1 text-xs ${style.accent} mb-2`}>
                  <MapPin className="w-3 h-3" />
                  <span className="truncate font-medium">{course.location || 'Location TBD'}</span>
                </div>
                
                {/* Course Name */}
                <h4 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors flex-1">
                  {course.name}
                </h4>
                
                {/* Stats Chips */}
                <div className="flex items-center gap-2 mt-3">
                  {course.par && (
                    <span className="px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30 text-xs font-medium text-foreground backdrop-blur-sm">
                      Par {course.par}
                    </span>
                  )}
                  {course.yardage && (
                    <span className="px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30 text-xs font-medium text-foreground backdrop-blur-sm">
                      {course.yardage.toLocaleString()} yds
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
