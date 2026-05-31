/**
 * CourseInfoCard - Flat ruled key-value grid (no full-bleed image)
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import { AMBER, INK, INK_FAINT, INK_MUTE, INK_TINT_07, SURFACE } from '../../_shared/tokens';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';

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

  const items = [
    tournament.venue_course_name && { label: 'Course', value: tournament.venue_course_name, link: courseLink },
    tournament.venue_name && tournament.venue_name !== tournament.venue_course_name && { label: 'Venue', value: tournament.venue_name },
    hasLocation && { label: 'Location', value: [tournament.venue_city, tournament.venue_state, tournament.venue_country].filter(Boolean).join(', ') },
    tournament.venue_par && { label: 'Par', value: `Par ${tournament.venue_par}` },
    tournament.venue_yardage && { label: 'Yardage', value: `${tournament.venue_yardage.toLocaleString()} yds` },
  ].filter(Boolean) as Array<{ label: string; value: string; link?: string | null }>;

  if (items.length === 0) return null;

  return (
    <motion.div
      style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      {/* Section eyebrow — canonical §6 slate-caps */}
      <div style={{ padding: '14px 16px 6px' }}>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: INK_MUTE,
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
        }}>
          Course Info
        </span>
      </div>

      {/* Flat ruled rows */}
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: `0.5px solid ${INK_TINT_07}` }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' as const, width: '88px', flexShrink: 0 }}>{item.label}</span>
          {item.link ? (
            <Link to={item.link} style={{ fontSize: 14, fontWeight: 700, color: AMBER, textDecoration: 'none', flex: 1 }} className="active:opacity-70 transition-opacity">
              {item.value}
            </Link>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 600, color: INK, flex: 1 }}>{item.value}</span>
          )}
        </div>
      ))}
      {courseId && tournament.venue_course_name && (
        <div style={{ padding: '4px 16px 0' }}>
          <ConnectHandicapCue variant="tour-venue" courseName={tournament.venue_course_name} />
        </div>
      )}
      <div style={{ height: '6px' }} />
    </motion.div>
  );
}
