/**
 * CourseInfoCard - Premium course information display
 * Glass card treatment, section entrance animation
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

const cardClass = "rounded-2xl overflow-hidden border border-border/40 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]";

export function CourseInfoCard({ tournament, courseImage, courseId }: CourseInfoCardProps) {
  const hasLocation = tournament.venue_city || tournament.venue_state || tournament.venue_country;
  
  const courseLink = courseId 
    ? `/courses/${courseId}`
    : tournament.venue_course_name 
      ? `/courses?search=${encodeURIComponent(tournament.venue_course_name)}`
      : null;

  return (
    <motion.div 
      className={cardClass}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      {/* Full-width course image banner */}
      {courseImage && (
        <div className="relative w-full aspect-[16/7] overflow-hidden group">
          <img 
            src={courseImage} 
            alt={tournament.venue_course_name || 'Course'} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Flag className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <h3 className="text-[14px] font-semibold text-foreground">Course</h3>
        </div>
        
        {courseLink && (
          <Link 
            to={courseLink}
            className="text-[12px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 active:scale-[0.97] transition-transform"
          >
            View Course
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex-1 min-w-0">
          {tournament.venue_course_name && (
            <h4 className="font-semibold text-foreground text-[16px] mb-1 truncate">
              {tournament.venue_course_name}
            </h4>
          )}
          
          {tournament.venue_name && tournament.venue_name !== tournament.venue_course_name && (
            <p className="text-[13px] text-muted-foreground mb-2 truncate">
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
    </motion.div>
  );
}