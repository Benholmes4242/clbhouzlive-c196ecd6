/**
 * BRIEF_COURSE_TAB_REBUILD §3.7 — WHO PLAYS HERE, flat.
 *
 * The people, named. Overlapping squircle avatars and a names line, on the flat
 * section rather than in a Panel — same read (useFriendsWhoPlayedCourse), same
 * 22px facepile, no bordered card. CourseFriendsStrip.tsx is left on disk and
 * added to the dead-file list rather than edited, so nothing shared moves.
 *
 * NO AVERAGE HERE, and none above either (§3.6): with the network at its current
 * size a circle average is nearly always identical to the overall or absent, and
 * naming two people says more than their mean. Recorded as REVERSIBLE — at a few
 * hundred connected members what your circle thinks earns its place back.
 *
 * Renders nothing when signed out or when nobody in the circle has played: an
 * empty facepile with a heading over it is a section about no one.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from './AboutSection';

/** Faces shown before the pile becomes a count. */
const MAX_FACES = 5;

interface WhoPlaysHereProps {
  courseId: string;
}

const WhoPlaysHere: React.FC<WhoPlaysHereProps> = ({ courseId }) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { data: friends = [] } = useFriendsWhoPlayedCourse(user?.id, courseId);

  if (!user || friends.length === 0) return null;

  const faces = friends.slice(0, MAX_FACES);
  const overflow = Math.max(0, friends.length - faces.length);

  const names = friends
    .slice(0, 2)
    .map((f) => f.profile.display_name || f.profile.username || '')
    .filter(Boolean);
  const rest = friends.length - names.length;

  return (
    <AboutSection
      heading={t('courseDetail.sections.whoPlaysHere')}
      meta={t('courseDetail.friends.meta', { count: friends.length })}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {faces.map((friend, index) => {
            const displayName = friend.profile.display_name || friend.profile.username || '?';
            return (
              <SquircleAvatar
                key={friend.user_id}
                src={friend.profile.profile_photo_url ?? undefined}
                alt={displayName}
                userId={friend.user_id}
                size={22}
                /* The pile sits on the flat canvas now, so the traced ring
                   traces the canvas rather than the retired panel fill. */
                ringColor={A.CANVAS}
                className={index > 0 ? '-ml-1.5' : ''}
              />
            );
          })}
          {overflow > 0 && (
            <div
              className="-ml-1.5 tabular-nums lining-nums"
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: '34%',
                background: A.TRACK,
                border: `2px solid ${A.CANVAS}`,
                color: A.MUTE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                padding: '0 4px',
                flexShrink: 0,
              }}
            >
              +{overflow}
            </div>
          )}
        </div>
        <div
          className="tabular-nums lining-nums"
          style={{
            minWidth: 0,
            flex: 1,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 600,
            color: A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {rest > 0
            ? t('courseDetail.friends.namesAndMore', { names: names.join(', '), count: rest })
            : names.join(', ')}
        </div>
      </div>
    </AboutSection>
  );
};

export default WhoPlaysHere;
