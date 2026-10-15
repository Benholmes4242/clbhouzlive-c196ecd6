/**
 * JourneySummaryCard - Course Legacy figure row.
 * Four figures: PLAYED, COUNTRIES, TOP 100, AVG RATING. No icons, no card
 * chrome beyond the analytical panel - the figures carry the meaning.
 *
 * PLAYED IS THE COURSE-LEGACY COUNT (§D): `user_course_activity` rows, courses
 * with no imported round included — 49 for the test member, 10 Sep 2026. It is
 * NOT the 35 courses with imported rounds that the course analytics sheet lists,
 * and the two are not expected to match. COUNTRIES is counted from the same 49
 * rows. See useUserCourseSummary for both definitions.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/i18n/format';
import { A, SANS, Panel, Action } from '@/features/courses/components/holes/analytical/tokens';

interface JourneySummaryCardProps {
  /**
   * Distinct `user_course_activity` courses. NULL means the read failed or has
   * not run: the figure is unknown and the label renders without one. Only a
   * fetched 0 is "no courses yet" and reaches the empty state below.
   */
  coursesPlayed: number | null;
  countriesPlayed: number | null;
  avgRating: number | null;
  /**
   * How many of their own ratings the RATING figure is the mean of. The label
   * had to shorten to "RATING" to fit its column (see the item comment), so the
   * word AVERAGE lived in the basis line, which was removed on 14 Sep 2026.
   * Feeds the COURSES RATED tile.
   */
  ratedCount?: number | null;
  /** Distinct courses in ANY Top 100 list - the same number as the filter chip. */
  top100Played?: number | null;
  /** World Top 100 standing sentence; null renders nothing. */
  standing?: string | null;
  isOwnProfile: boolean;
  displayName?: string;
  className?: string;
}

export const JourneySummaryCard: React.FC<JourneySummaryCardProps> = ({
  coursesPlayed,
  countriesPlayed,
  avgRating,
  ratedCount,
  standing,
  top100Played,
  isOwnProfile,
  displayName,
  className,
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { t } = useTranslation('courses');

  const kicker = isOwnProfile
    ? t('legacy.kickerOwn', { defaultValue: 'YOUR COURSE LEGACY' })
    : t('legacy.kickerOther', {
        name: (displayName || 'Their').toUpperCase(),
        defaultValue: '{{name}} - COURSE LEGACY',
      });

  if (coursesPlayed === 0) {
    return (
      <div className={cn('px-4', className)}>
        <Panel kicker={kicker}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', fontFamily: SANS }}>
            <MapPin size={20} color={A.DIM} strokeWidth={2} />
            <div style={{ marginTop: 10, fontSize: 14.5, fontWeight: 700, color: A.INK }}>
              {isOwnProfile
                ? t('legacy.emptyTitleOwn', { defaultValue: 'No courses logged yet' })
                : t('legacy.emptyTitleOther', { defaultValue: 'No courses played yet' })}
            </div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: A.MUTE, maxWidth: 260 }}>
              {isOwnProfile
                ? t('legacy.emptyBodyOwn', { defaultValue: 'Rate a course and it starts here.' })
                : t('legacy.emptyBodyOther', { defaultValue: 'Nothing on the record yet.' })}
            </div>
            {isOwnProfile && (
              <div style={{ marginTop: 10 }}>
                <Action
                  label={t('legacy.findCourses', { defaultValue: 'Find courses' })}
                  onClick={() => navigate('/courses')}
                />
              </div>
            )}
          </div>
        </Panel>
      </div>
    );
  }

  /*
   * THE RECORD BLOCK (BRIEF_PROFILE_COURSES_REBUILD phase 1). Hero figure,
   * World Top 100 standing line, three tiles. A null figure renders its label
   * with an empty value - never a substituted zero.
   */
  const fig = (n: number | null | undefined) => (n == null ? '' : formatNumber(n));
  const tiles = [
    { label: 'TOP 100 PLAYED', value: fig(top100Played) },
    { label: 'YOUR AVERAGE', value: avgRating == null ? '' : avgRating.toFixed(1) },
    { label: 'COURSES RATED', value: fig(ratedCount) },
  ];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('px-4', className)}
    >
      <Panel kicker={kicker}>
        <div style={{ fontFamily: SANS }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <span data-testid="record-played" style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: 0.8, color: A.INK, fontVariantNumeric: 'tabular-nums lining-nums' }}>
              {fig(coursesPlayed)}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.BODY }}>courses played</div>
              <div style={{ fontSize: 12.5, color: A.DIM }}>
                across <b data-testid="record-countries" style={{ color: A.BODY }}>{fig(countriesPlayed)}</b> countries
              </div>
            </div>
          </div>
          {standing && (
            <div data-testid="record-standing" style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.5, color: A.MUTE, borderLeft: `2px solid ${A.AMBER}`, paddingLeft: 10 }}>
              {standing}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {tiles.map((tile) => (
              <div key={tile.label} style={{ flex: 1, minWidth: 0, background: A.PANEL, borderRadius: 10, padding: '11px 10px' }}>
                <div data-testid={`tile-${tile.label}`} style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, fontVariantNumeric: 'tabular-nums', minHeight: 21 }}>
                  {tile.value}
                </div>
                <div style={{ marginTop: 4, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: A.DIM }}>
                  {tile.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </motion.div>
  );
};
