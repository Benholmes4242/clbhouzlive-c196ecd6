/**
 * BRIEF_COURSE_TAB_REBUILD §3.7 (widened) — WHO PLAYS HERE, flat.
 *
 * WIDENED FROM CIRCLE-ONLY TO ALL MEMBERS. As first built this section did not
 * exist for the 52 of 99 members who follow nobody, and never existed for a
 * signed-out visitor on a shared course link — the person most likely to be
 * deciding whether the place is worth playing. "Thirteen people you could ask
 * about this place" is useful to all of them; "four of your friends" is useful
 * to thirty.
 *
 * The circle is still called out when there is one: circle faces come first and
 * circle members are the ones named. The figure is always the true total.
 *
 * NO AVERAGE, here or above (§3.6). Recorded as REVERSIBLE, not retired.
 *
 * Renders whenever at least one member has played. Absent only when nobody has,
 * which the tab's no-data state already covers.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useMembersWhoPlayedCourse } from '@/hooks/useMembersWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from './AboutSection';

/** Four faces maximum, per the brief. */
const MAX_FACES = 4;

interface WhoPlaysHereProps {
  courseId: string;
}

const WhoPlaysHere: React.FC<WhoPlaysHereProps> = ({ courseId }) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { data } = useMembersWhoPlayedCourse(courseId, user?.id);

  const total = data?.total ?? 0;
  if (total === 0) return null;

  const members = data?.members ?? [];
  const hasCircle = data?.hasCircle ?? false;
  const circleHere = members.filter((m) => m.in_circle);

  /* Faces are already circle-first from the hook. Signed out, profiles are not
     readable, so there are no faces to show and the sentence stands alone. */
  const faces = members.filter((m) => m.profile).slice(0, MAX_FACES);
  const overflow = Math.max(0, total - faces.length);

  const named = circleHere
    .slice(0, 2)
    .map((m) => m.profile?.display_name || m.profile?.username || '')
    .filter(Boolean);

  let sentence: string;
  if (named.length > 0) {
    // A circle, and some of it has played here: name them, count the rest.
    const rest = total - named.length;
    sentence =
      rest > 0
        ? t('courseDetail.members.namesAndOthers', { names: named.join(', '), count: rest })
        : named.join(', ');
  } else if (hasCircle) {
    // A circle, but none of it here yet — say so rather than staying silent.
    sentence = t('courseDetail.members.noneInCircle', { count: total });
  } else {
    // No circle at all, or signed out.
    sentence = t('courseDetail.members.havePlayed', { count: total });
  }

  return (
    <AboutSection
      heading={t('courseDetail.sections.whoPlaysHere')}
      meta={t('courseDetail.whoPlaysHereMeta', { count: total })}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {faces.length > 0 && (
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {faces.map((member, index) => {
              const displayName =
                member.profile?.display_name || member.profile?.username || '?';
              return (
                <SquircleAvatar
                  key={member.user_id}
                  src={member.profile?.profile_photo_url ?? undefined}
                  alt={displayName}
                  userId={member.user_id}
                  size={34}
                  /* The pile sits on the flat canvas now, so the traced ring
                     traces the canvas rather than the retired panel fill. */
                  ringColor={A.CANVAS}
                  className={index > 0 ? '-ml-2.5' : ''}
                />
              );
            })}
          </div>
        )}
        <div
          className="tabular-nums lining-nums"
          style={{
            minWidth: 0,
            flex: 1,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            color: A.MUTE,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sentence}
        </div>
      </div>
    </AboutSection>
  );
};

export default WhoPlaysHere;
