/**
 * CourseInfoCard - Course information section (no card container)
 */

import { Link } from 'react-router-dom';
import { MapPin, Flag, Ruler, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';

interface CourseInfoCardProps {
  tournament: TourTournament;
  courseImage?: string | null;
  courseId?: string | null;
}

export function CourseInfoCard({ tournament, courseImage, courseId }: CourseInfoCardProps) {
  const hasLocation = tournament.venue_city || tournament.venue_state || tournament.venue_country;
  
  const courseLink = courseId 
    ? `/courses/${courseId}`
    : tournament.venue_course_name 
      ? `/courses?search=${encodeURIComponent(tournament.venue_course_name)}`
      : null;

  return (
    <motion.div 
      className="py-6 border-t border-border"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      {/* Course image */}
      {courseImage && (
        <div className="relative w-full aspect-[16/7] overflow-hidden rounded-xl mb-4 group">
          <img 
            src={courseImage} 
            alt={tournament.venue_course_name || 'Course'} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      
      {/* Course name - tappable */}
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          {tournament.venue_course_name && (
            courseLink ? (
              <Link to={courseLink} className="group/link">
                <h3 className="text-lg font-semibold text-foreground group-hover/link:text-primary transition-colors truncate">
                  {tournament.venue_course_name}
                </h3>
              </Link>
            ) : (
              <h3 className="text-lg font-semibold text-foreground truncate">
                {tournament.venue_course_name}
              </h3>
            )
          )}
          
          {tournament.venue_name && tournament.venue_name !== tournament.venue_course_name && (
            <p className="text-sm text-muted-foreground truncate">
              {tournament.venue_name}
            </p>
          )}
        </div>
        
        {courseLink && (
          <Link 
            to={courseLink}
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 active:scale-[0.97] transition-transform shrink-0 ml-3"
          >
            View Course
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-4 mt-2">
        {tournament.venue_par && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Flag className="w-3.5 h-3.5" />
            <span className="font-medium">Par {tournament.venue_par}</span>
          </span>
        )}
        
        {tournament.venue_yardage && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Ruler className="w-3.5 h-3.5" />
            <span className="font-medium">{tournament.venue_yardage.toLocaleString()} yards</span>
          </span>
        )}
        
        {hasLocation && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {[tournament.venue_city, tournament.venue_state, tournament.venue_country].filter(Boolean).join(', ')}
            </span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
