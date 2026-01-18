/**
 * VenueAtlas - Explorable venue/course cards
 * Signature holes, course personality, famous moments
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Flag, Trophy, ChevronRight, X } from 'lucide-react';
import type { Venue } from '../types';
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
  return (
    <motion.button
      onClick={onClick}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden group"
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
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="w-3.5 h-3.5 text-white/70" />
          <span className="text-xs text-white/70">{course.location}</span>
        </div>
        <h3 className="font-bold text-white text-left line-clamp-2 group-hover:text-emerald-300 transition-colors">
          {course.name}
        </h3>
        <p className="text-xs text-white/60 mt-1 text-left">
          {course.tournamentName}
        </p>
        
        {/* Stats */}
        {(course.par || course.yardage) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
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
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Venue Atlas</h2>
          <p className="text-sm text-slate-500 mt-0.5">Tour venues and destinations</p>
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
          Explore All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Venue grid */}
      <div className="grid grid-cols-2 gap-4">
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
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              <div className="relative h-56 bg-emerald-800">
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
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-1.5 mb-2 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{selectedCourse.location}</span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {selectedCourse.name}
                </h2>
                <p className="text-slate-500 text-sm mb-4">
                  Home of {selectedCourse.tournamentName}
                </p>

                {/* Course stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {selectedCourse.par && (
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{selectedCourse.par}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Par</p>
                    </div>
                  )}
                  {selectedCourse.yardage && (
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-slate-800">{selectedCourse.yardage.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Yards</p>
                    </div>
                  )}
                </div>

                {/* Placeholder for future features */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-400 text-center">
                    More venue details coming soon...
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
