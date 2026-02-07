/**
 * CourseInfoCard - Premium course information display
 * Semantic token compliant
 */

import { Link } from 'react-router-dom';
import { MapPin, Flag, Ruler, ExternalLink } from 'lucide-react';
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
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Flag className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-foreground">Course</h3>
        </div>
        
        {courseLink && (
          <Link 
            to={courseLink}
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 active:scale-[0.97] transition-transform"
          >
            View Course
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Course thumbnail */}
          {courseImage && (
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
              <img 
                src={courseImage} 
                alt={tournament.venue_course_name || 'Course'} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {tournament.venue_course_name && (
              <h4 className="font-semibold text-foreground text-lg mb-1 truncate">
                {tournament.venue_course_name}
              </h4>
            )}
            
            {tournament.venue_name && tournament.venue_name !== tournament.venue_course_name && (
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {tournament.venue_name}
              </p>
            )}
            
            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              {tournament.venue_par && (
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                    <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="font-medium">Par {tournament.venue_par}</span>
                </span>
              )}
              
              {tournament.venue_yardage && (
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                    <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{tournament.venue_yardage.toLocaleString()} yards</span>
                </span>
              )}
            </div>
            
            {hasLocation && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {[tournament.venue_city, tournament.venue_state, tournament.venue_country].filter(Boolean).join(', ')}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
