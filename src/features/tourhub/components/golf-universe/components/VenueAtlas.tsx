/**
 * VenueAtlas - Explorable venue/course cards
 * Signature holes, course personality, famous moments
 * 
 * Refinements:
 * - Uses actual venue country (no USA hardcode)
 * - Graceful fallback if country unknown
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, X } from 'lucide-react';
import type { FeaturedCourse } from '../../../hooks/useTourOverviewData';

interface VenueAtlasProps {
  courses: FeaturedCourse[];
  courseImages?: Map<string, { imageUrl: string | null }>;
}

function VenueCard({ 
  course, 
  imageUrl,
  onClick,
}: { 
  course: FeaturedCourse; 
  imageUrl?: string;
  onClick: () => void;
}) {
  // Parse location - don't hardcode country
  const locationParts = course.location?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const displayLocation = locationParts.length > 0 ? locationParts.join(', ') : null;

  return (
    <motion.button
      onClick={onClick}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden group"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Background */}
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={course.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-900" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        {displayLocation && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-white/70" />
            <span className="text-[11px] text-white/70 truncate">{displayLocation}</span>
          </div>
        )}
        <h3 className="font-semibold text-white text-sm text-left line-clamp-2 group-hover:text-emerald-300 transition-colors">
          {course.name}
        </h3>
        
        {/* Stats */}
        {(course.par || course.yardage) && (
          <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50">
            {course.par && <span>Par {course.par}</span>}
            {course.yardage && <span>{course.yardage.toLocaleString()} yds</span>}
          </div>
        )}
      </div>
    </motion.button>
  );
}

export const VenueAtlas = memo(function VenueAtlas({
  courses,
  courseImages,
}: VenueAtlasProps) {
  const [selectedCourse, setSelectedCourse] = useState<FeaturedCourse | null>(null);

  if (courses.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Section Header - tighter */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-900">Venue Atlas</h2>
        <button className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700">
          Explore
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Venue grid - tighter gaps */}
      <div className="grid grid-cols-2 gap-3">
        {courses.slice(0, 4).map((course) => {
          const image = courseImages?.get(course.name);
          return (
            <VenueCard
              key={course.id}
              course={course}
              imageUrl={image?.imageUrl || undefined}
              onClick={() => setSelectedCourse(course)}
            />
          );
        })}
      </div>

      {/* Expanded venue detail */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              <div className="relative h-48 bg-emerald-800">
                {courseImages?.get(selectedCourse.name)?.imageUrl && (
                  <img 
                    src={courseImages.get(selectedCourse.name)?.imageUrl || ''}
                    alt={selectedCourse.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {selectedCourse.location && (
                  <div className="flex items-center gap-1.5 mb-2 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{selectedCourse.location}</span>
                  </div>
                )}

                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {selectedCourse.name}
                </h2>
                <p className="text-slate-500 text-sm mb-4">
                  Home of {selectedCourse.tournamentName}
                </p>

                {/* Course stats */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {selectedCourse.par && (
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">{selectedCourse.par}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Par</p>
                    </div>
                  )}
                  {selectedCourse.yardage && (
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-slate-800">{selectedCourse.yardage.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Yards</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedCourse(null)}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-medium rounded-full hover:bg-slate-200 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
