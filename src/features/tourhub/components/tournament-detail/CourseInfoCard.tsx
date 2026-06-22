/**
 * CourseInfoCard — Flush section: "COURSE" eyebrow, venue name, PAR/YARDS/PURSE
 * stat trio. Optional link to the courses detail page.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import {
  AMBER, INK, INK_FAINT, INK_MUTE, INK_TINT_07, SURFACE,
} from '../../_shared/tokens';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';

interface CourseInfoCardProps {
  tournament: TourTournament;
  courseImage?: string | null;
  courseId?: string | null;
}

export function CourseInfoCard({ tournament, courseId }: CourseInfoCardProps) {
  const venueName = tournament.venue_course_name || tournament.venue_name;
  if (!venueName) return null;

  const cityLine = [tournament.venue_city, tournament.venue_state, tournament.venue_country]
    .filter(Boolean).join(', ');

  const courseLink = courseId
    ? `/courses/${courseId}`
    : tournament.venue_course_name
      ? `/courses?search=${encodeURIComponent(tournament.venue_course_name)}`
      : null;

  const purse = tournament.purse
    ? tournament.purse >= 1_000_000
      ? `$${(tournament.purse / 1_000_000).toFixed(1)}M`
      : `$${(tournament.purse / 1_000).toFixed(0)}K`
    : null;

  const stats: Array<[string, string]> = [];
  if (tournament.venue_par) stats.push(['PAR', String(tournament.venue_par)]);
  if (tournament.venue_yardage) stats.push(['YARDS', tournament.venue_yardage.toLocaleString()]);
  if (purse) stats.push(['PURSE', purse]);

  const NameTag: React.ElementType = courseLink ? Link : 'span';
  const nameProps = courseLink ? { to: courseLink } : {};

  return (
    <motion.div
      style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}`, padding: '14px 16px 16px' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 12 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: INK_MUTE,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>Course</span>
      </div>

      <NameTag
        {...(nameProps as any)}
        style={{
          fontSize: 16, fontWeight: 800,
          color: courseLink ? AMBER : INK,
          textDecoration: 'none', display: 'block',
        }}
        className={courseLink ? 'active:opacity-70 transition-opacity' : undefined}
      >
        {venueName}
      </NameTag>

      {cityLine && (
        <div style={{ fontSize: 12, fontWeight: 600, color: INK_MUTE, marginTop: 2 }}>
          {cityLine}
        </div>
      )}

      {stats.length > 0 && (
        <div style={{ display: 'flex', gap: 28, marginTop: 14 }}>
          {stats.map(([label, value]) => (
            <div key={label}>
              <span style={{
                fontSize: 9, fontWeight: 800, color: INK_FAINT,
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>{label}</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: INK, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {courseId && tournament.venue_course_name && (
        <div style={{ marginTop: 14 }}>
          <ConnectHandicapCue variant="tour-venue" courseName={tournament.venue_course_name} />
        </div>
      )}
    </motion.div>
  );
}
