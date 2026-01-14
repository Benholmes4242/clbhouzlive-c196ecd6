/**
 * CoursesPhotoGrid - Tour Venues Aspirational Gallery
 * Larger cards, edge-to-edge within section, subtle fade + upward movement on scroll
 */

import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import type { FeaturedCourse } from '../../hooks/useTourOverviewData';

interface CoursesPhotoGridProps {
  courses: FeaturedCourse[];
  courseImages?: Map<string, { imageUrl: string | null; name: string }>;
}

function CourseCard({ 
  course, 
  resolvedImage, 
  index 
}: { 
  course: FeaturedCourse; 
  resolvedImage: string | null | undefined;
  index: number;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Link
        to={`/tourhub/tournament/${course.id}`}
        className="group relative overflow-hidden rounded-xl aspect-[4/3] block shadow-md hover:shadow-xl transition-shadow"
      >
        {/* Background image or fallback - slightly dimmed to prioritise text */}
        {resolvedImage ? (
          <>
            <img
              src={resolvedImage}
              alt={course.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Slight dim for text priority */}
            <div className="absolute inset-0 bg-black/15" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white/10">
                {course.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </span>
            </div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          {/* Location pill - same style as hero stats */}
          <div className="flex items-center gap-1 self-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white text-[11px] font-medium">
              <MapPin className="w-3 h-3" />
              {course.location || 'USA'}
            </span>
          </div>
          
          {/* Bottom content */}
          <div>
            {/* Course name - bold */}
            <p className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow-lg group-hover:text-white/95 transition-colors">
              {course.name}
            </p>
            
            {/* Stats chips - same style as hero */}
            <div className="flex items-center gap-2 mt-2.5">
              {course.par && (
                <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white text-[11px] font-medium">
                  Par {course.par}
                </span>
              )}
              {course.yardage && (
                <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white text-[11px] font-medium">
                  {course.yardage.toLocaleString()} yds
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CoursesPhotoGrid({ courses, courseImages }: CoursesPhotoGridProps) {
  if (!courses.length) return null;

  return (
    <div className="space-y-6">
      {/* Header - matching Schedule page section headers */}
      <div className="flex items-center justify-between">
        <h3 
          className="font-extrabold text-slate-800 uppercase"
          style={{ fontSize: '13px', letterSpacing: '0.08em' }}
        >
          The Tour Venues
        </h3>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
        >
          All venues <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 2-column grid - larger cards */}
      <div className="grid grid-cols-2 gap-4">
        {courses.map((course, index) => {
          const resolvedFromName = courseImages?.get(course.name)?.imageUrl;
          const resolvedFromTournament = courseImages?.get(course.tournamentName)?.imageUrl;
          const resolvedImage = resolvedFromName || resolvedFromTournament || course.imageUrl;
          
          return (
            <CourseCard 
              key={course.id}
              course={course}
              resolvedImage={resolvedImage}
              index={index}
            />
          );
        })}
      </div>
    </div>
  );
}
