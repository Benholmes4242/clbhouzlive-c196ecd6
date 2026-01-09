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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">Featured Courses</h3>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          All venues <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2-column grid of photo cards */}
      <div className="grid grid-cols-2 gap-3">
        {courses.map((course, idx) => {
          // Try to get image from resolved course images
          const resolvedImage = courseImages?.get(course.tournamentName)?.imageUrl || course.imageUrl;
          
          return (
            <Link
              key={course.id}
              to={`/tourhub/tournament/${course.id}`}
              className="group relative overflow-hidden rounded-xl aspect-[4/3]"
            >
              {/* Background image or gradient */}
              {resolvedImage ? (
                <img
                  src={resolvedImage}
                  alt={course.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900">
                  {/* Contour texture */}
                  <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                    <path d="M0 50 Q25 30 50 50 T100 50" fill="none" stroke="white" strokeWidth="0.5" />
                    <path d="M0 70 Q25 50 50 70 T100 70" fill="none" stroke="white" strokeWidth="0.3" />
                    <circle cx="75" cy="25" r="15" fill="none" stroke="white" strokeWidth="0.3" />
                  </svg>
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
