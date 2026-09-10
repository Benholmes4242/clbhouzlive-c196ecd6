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
import { A, SANS, Panel, StatRow, Action } from '@/features/courses/components/holes/analytical/tokens';

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
   * word AVERAGE lives in the basis line instead and needs this count to say
   * anything. Null means unknown: the basis line then omits the rating clause
   * rather than guessing a population.
   */
  ratedCount?: number | null;
  top100Played?: number | null;
  isOwnProfile: boolean;
  displayName?: string;
  className?: string;
}

export const JourneySummaryCard: React.FC<JourneySummaryCardProps> = ({
  coursesPlayed,
  countriesPlayed,
  avgRating,
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

  const items = [
    // Unknown renders the label with no figure. A dash would read as a value.
    { label: t('legacy.played', { defaultValue: 'PLAYED' }), value: coursesPlayed == null ? '' : String(coursesPlayed) },
    ...(countriesPlayed != null && countriesPlayed > 0
      ? [{ label: t('legacy.countries', { defaultValue: 'COUNTRIES' }), value: String(countriesPlayed) }]
      : []),
    ...(top100Played != null && top100Played > 0
      ? [{
          // Names the list: the figure is the WORLDWIDE list's played count
          // (useTop100ProgressForUser), not every Top 100 list combined.
          //
          // "WORLD 100", NOT "WORLD TOP 100", AND THE REASON IS MEASURED. Four
          // items share the panel's inner width: at 390pt that is
          // (390 - 32 page - 32 panel) / 4 = 81.5px a column. At the label's
          // canon 11/700/0.13em, "WORLD TOP 100" measures 105.5px, so it CANNOT
          // fit at any legal type size and used to break after "TOP" - which
          // read as a separate "100" column. "WORLD 100" measures 75.3px and
          // holds one line with the list still named.
          label: t('legacy.top100World', { defaultValue: 'WORLD 100' }),
          value: String(top100Played),
        }]
      : []),
    ...(avgRating != null && avgRating > 0
      // "AVG RATING" measures 80.9px against an 81.5px column - it fitted only
      // by 0.6px, which is a wrap waiting for a wider glyph or a longer locale.
      // "RATING" is 50.2px and says the same thing beside a one-decimal figure.
      ? [{ label: t('legacy.avgRating', { defaultValue: 'RATING' }), value: avgRating.toFixed(1) }]
      : []),
  ];

  /**
   * THE BASIS LINE - IT CARRIES THE WORD THE LABELS CANNOT AFFORD.
   *
   * PLAYED counts every course on the member's record, including ones with no
   * imported round, so it is stated rather than left to be inferred from the 35
   * the analytics sheet lists. RATING had to lose "AVG" to fit its column, and
   * "RATING 8.4" reads as one course's rating, so this line says what the figure
   * averages over and how many ratings are in it. One sentence, both bases.
   *
   * The rating clause is omitted when the count is unknown - a basis line that
   * names the wrong population is worse than a short one.
   */
  const ratingClause =
    avgRating != null && avgRating > 0 && ratedCount != null && ratedCount > 0
      ? t('legacy.basisRating', {
          count: ratedCount,
          defaultValue: 'Rating is the average of your {{count}} course ratings.',
        })
      : '';
  const basis = [
    t('legacy.basisPlayed', {
      defaultValue: 'Played counts every course on your record, rated rounds or not.',
    }),
    ratingClause,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('px-4', className)}
    >
      <Panel kicker={kicker} footer={isOwnProfile ? basis : undefined}>
        {/* labelNoWrap: every label here is measured to fit one 81.5px column at
            390pt (see the item comments), so a wrap can only mean a locale
            string longer than the English default - and a truncation reads as
            one label where a wrap reads as two. */}
        <StatRow size={22} items={items} labelNoWrap />
      </Panel>
    </motion.div>
  );
};
