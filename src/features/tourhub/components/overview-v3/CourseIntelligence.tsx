/**
 * CourseIntelligence - This Week's Venues
 * Golf-specific course cards with real images and par/yardage info
 * Uses useVenueImage hook for smart course image matching
 */

import { motion } from 'framer-motion';
import { useCoursesThisWeek, type CourseThisWeek } from '../../hooks/useOverviewModules';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { getTourLogo } from '../../utils/tourLogos';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Individual Course Card with venue image fetching
 */
function CourseCard({ 
  course, 
  index 
}: { 
  course: CourseThisWeek; 
  index: number;
}) {
  // Use the smart venue image hook for each card
  const { data: venueImage } = useVenueImage(course.venueName, course.venueCity);
  
  // Use real image or fallback
  const backgroundImage = venueImage?.imageUrl || getFallbackCourseImage(course.tournamentName);
  const hasRealImage = !!venueImage?.imageUrl;

  return (
    <motion.div
      className="flex-shrink-0 w-[260px] bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      {/* Course Image */}
      <div className="h-32 relative">
        {hasRealImage ? (
          <img
            src={backgroundImage}
            alt={course.venueName || course.tournamentName}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback gradient if no image */
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700" />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Tour logo badge */}
        <div className="absolute top-2 right-2">
          <img
            src={getTourLogo(course.tourSlug)}
            alt=""
            className="h-5 w-auto drop-shadow-lg"
          />
        </div>
        
        {/* Venue Name */}
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-white font-semibold text-sm truncate drop-shadow-md">
            {course.venueName || course.tournamentName}
          </h3>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3">
        <div className="flex items-center justify-between text-sm">
          {course.venuePar && (
            <span className="text-slate-500">Par {course.venuePar}</span>
          )}
          {course.venueYardage && (
            <span className="text-slate-500">
              {course.venueYardage.toLocaleString()} yds
            </span>
          )}
          {!course.venuePar && !course.venueYardage && (
            <span className="text-slate-400">Course details TBA</span>
          )}
        </div>

        {/* Tournament Name if different from venue */}
        {course.venueName && course.venueName !== course.tournamentName && (
          <p className="text-xs text-slate-400 mt-2 truncate">
            {course.tournamentName}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function CourseIntelligence() {
  const { data: courses, isLoading } = useCoursesThisWeek();

  // Don't render if no courses this week
  if (!isLoading && (!courses || courses.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-6 border-t border-slate-100">
        <div className="px-4 mb-4">
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="flex-shrink-0 w-[260px] h-[180px] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Course Intelligence
        </p>
        <h2 className="text-lg font-bold text-slate-900">This Week's Venues</h2>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2 -webkit-overflow-scrolling-touch">
        {courses!.map((course, idx) => (
          <CourseCard 
            key={course.tournamentId} 
            course={course} 
            index={idx} 
          />
        ))}
      </div>
    </section>
  );
}
