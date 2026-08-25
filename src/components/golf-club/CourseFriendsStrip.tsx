/**
 * CourseFriendsStrip - Block 3c of the Course tab.
 *
 * Analytical treatment (BRIEF_COURSE_TAB_LOWER_BLOCKS): plain panel, no
 * gradients, no icon tiles. Overlapping 22px avatars plus a names line.
 * The friends average rating lives in the community rating panel, not here.
 * Renders nothing when no friends have played.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { A, LABEL, Panel } from '@/features/courses/components/holes/analytical/tokens';

interface CourseFriendsStripProps {
  courseId: string;
  courseName: string;
}

export const CourseFriendsStrip: React.FC<CourseFriendsStripProps> = ({ courseId }) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();

  const { data: friends = [] } = useFriendsWhoPlayedCourse(user?.id, courseId);

  if (!user || friends.length === 0) return null;

  const visibleFriends = friends.slice(0, 5);
  const overflowCount = Math.max(0, friends.length - visibleFriends.length);

  const names = friends
    .slice(0, 2)
    .map((f) => f.profile.display_name || f.profile.username || '')
    .filter(Boolean);
  const rest = friends.length - names.length;

  return (
    <Panel style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {visibleFriends.map((friend, index) => {
            const displayName = friend.profile.display_name || friend.profile.username || '?';
            return (
              <SquircleAvatar
                key={friend.user_id}
                src={friend.profile.profile_photo_url ?? undefined}
                alt={displayName}
                userId={friend.user_id}
                size={22}
                ringColor={A.PANEL}
                className={index > 0 ? '-ml-1.5' : ''}
              />
            );
          })}
          {overflowCount > 0 && (
            <div
              className="-ml-1.5"
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: '34%',
                background: A.TRACK,
                border: `2px solid ${A.PANEL}`,
                color: A.MUTE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums lining-nums',
                padding: '0 4px',
                flexShrink: 0,
              }}
            >
              +{overflowCount}
            </div>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={LABEL}>{t('courseDetail.friends.kicker')}</div>
          <div
            style={{
              fontSize: 12.5,
              color: A.INK,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums lining-nums',
              marginTop: 3,
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
      </div>
    </Panel>
  );
};

export default CourseFriendsStrip;
