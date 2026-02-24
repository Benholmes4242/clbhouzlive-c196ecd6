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
      className="py-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      {/* Course image — full bleed with overlay */}
      {courseImage && (
        <div className="relative w-[calc(100%+32px)] -ml-4 overflow-hidden mb-4 group" style={{ height: `${Math.round(306 * 0.8)}px` }}>
          <img 
            src={courseImage} 
            alt={tournament.venue_course_name || 'Course'} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Overlay content */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-4">
            {tournament.venue_course_name && (
              courseLink ? (
                <Link to={courseLink} className="group/link">
                  <h3 className="text-white font-semibold text-[17px] group-hover/link:text-white/80 transition-colors truncate drop-shadow-md">
                    {tournament.venue_course_name}
                  </h3>
                </Link>
              ) : (
                <h3 className="text-white font-semibold text-[17px] truncate drop-shadow-md">
                  {tournament.venue_course_name}
                </h3>
              )
            )}
            
            {tournament.venue_name && tournament.venue_name !== tournament.venue_course_name && (
              <p className="text-sm text-white/70 truncate">
                {tournament.venue_name}
              </p>
            )}

            {/* Stats chips */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {tournament.venue_par && (
                <span 
                  className="px-2 py-[4px] rounded-[5px] uppercase"
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    color: 'rgba(255, 255, 255, 0.85)',
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  Par {tournament.venue_par}
                </span>
              )}
              
              {tournament.venue_yardage && (
                <span 
                  className="px-2 py-[4px] rounded-[5px] uppercase"
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    color: 'rgba(255, 255, 255, 0.85)',
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {tournament.venue_yardage.toLocaleString()} yards
                </span>
              )}
              
              {hasLocation && (
                <span 
                  className="px-2 py-[4px] rounded-[5px] uppercase truncate"
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    color: 'rgba(255, 255, 255, 0.85)',
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {[tournament.venue_city, tournament.venue_state, tournament.venue_country].filter(Boolean).join(', ')}
                </span>
              )}
              
              {courseLink && (
                <Link 
                  to={courseLink}
                  className="px-2 py-[4px] rounded-[5px] uppercase active:scale-[0.97] transition-transform"
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: 'rgba(255, 255, 255, 0.95)',
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  View Course →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Fallback: show info below if no image */}
      {!courseImage && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              {tournament.venue_course_name && (
                courseLink ? (
                  <Link to={courseLink} className="group/link">
                    <h3 className="text-[17px] font-semibold text-foreground group-hover/link:text-primary transition-colors truncate">
                      {tournament.venue_course_name}
                    </h3>
                  </Link>
                ) : (
                  <h3 className="text-[17px] font-semibold text-foreground truncate">
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
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-0.5 active:scale-[0.97] transition-transform shrink-0 ml-3"
              >
                View Course
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          
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
        </>
      )}
    </motion.div>
  );
}
