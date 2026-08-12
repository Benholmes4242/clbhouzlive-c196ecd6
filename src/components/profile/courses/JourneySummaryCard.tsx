/**
 * JourneySummaryCard - Course Legacy figure row.
 * Four figures: PLAYED, COUNTRIES, TOP 100, AVG RATING. No icons, no card
 * chrome beyond the analytical panel - the figures carry the meaning.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { A, SANS, Panel, StatRow, Action } from '@/features/courses/components/holes/analytical/tokens';

interface JourneySummaryCardProps {
  coursesPlayed: number;
  countriesPlayed: number;
  avgRating: number | null;
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
    { label: t('legacy.played', { defaultValue: 'PLAYED' }), value: String(coursesPlayed) },
    ...(countriesPlayed > 0
      ? [{ label: t('legacy.countries', { defaultValue: 'COUNTRIES' }), value: String(countriesPlayed) }]
      : []),
    ...(top100Played != null && top100Played > 0
      ? [{
          // Names the list: the figure is the WORLDWIDE list's played count
          // (useTop100ProgressForUser), not every Top 100 list combined.
          label: t('legacy.top100World', { defaultValue: 'WORLD TOP 100' }),
          value: String(top100Played),
        }]
      : []),
    ...(avgRating != null && avgRating > 0
      ? [{ label: t('legacy.avgRating', { defaultValue: 'AVG RATING' }), value: avgRating.toFixed(1) }]
      : []),
  ];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('px-4', className)}
    >
      <Panel kicker={kicker}>
        <StatRow size={22} items={items} />
      </Panel>
    </motion.div>
  );
};
