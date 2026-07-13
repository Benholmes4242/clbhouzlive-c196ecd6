import React from 'react';
import { Users } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface CourseFriendsStripProps {
  courseId: string;
  courseName: string;
}

export const CourseFriendsStrip: React.FC<CourseFriendsStripProps> = ({ courseId }) => {
  const { user } = useSupabaseSession();

  const { data: friends = [] } = useFriendsWhoPlayedCourse(user?.id, courseId);

  if (!user || friends.length === 0) return null;

  const totalFriends = friends.length;
  const visibleFriends = friends.slice(0, 3);
  const overflowCount = Math.max(0, totalFriends - visibleFriends.length);

  const friendsWithScores = friends.filter((f) => f.rating_value != null);
  const friendsAvgScore =
    friendsWithScores.length > 0
      ? (
          friendsWithScores.reduce((sum, f) => sum + (f.rating_value ?? 0), 0) /
          friendsWithScores.length
        ).toFixed(1)
      : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 18,
        margin: '0 16px',
        width: 'calc(100% - 32px)',
        textAlign: 'left',
        background: 'linear-gradient(135deg, rgba(247,147,30,0.07), rgba(247,147,30,0.02))',
        border: '1.5px solid rgba(247,147,30,0.15)',
      }}
    >
      {/* Amber gradient icon square (journey-hero language) */}
      <div style={{
        width: 46, height: 46, borderRadius: 13, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #F7931E, #FBBC2E)', color: '#fff',
      }}>
        <Users size={22} strokeWidth={2} />
      </div>

      {/* Copy */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
          Friends who've played here
        </div>
        <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
          {totalFriends} {totalFriends === 1 ? 'friend' : 'friends'} played this course
        </div>
      </div>

      {/* Right cluster: facepile + avg badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex' }}>
          {visibleFriends.map((friend, index) => {
            const displayName = friend.profile.display_name || friend.profile.username || '?';
            const initial = displayName[0]?.toUpperCase() || '?';
            return friend.profile.profile_photo_url ? (
              <SquircleAvatar
                key={friend.user_id}
                src={friend.profile.profile_photo_url}
                alt={displayName}
                size={30}
                ringColor="#FEF7EE"
                className={index > 0 ? '-ml-2' : ''}
              />
            ) : (
              <SquircleAvatar
                key={friend.user_id}
                size={30}
                alt={displayName}
                fallback={initial}
                ringColor="#FEF7EE"
                className={index > 0 ? '-ml-2' : ''}
              />
            );
          })}
          {overflowCount > 0 && (
            <div
              className="-ml-2"
              style={{
                minWidth: 30, height: 30, borderRadius: '34%',
                background: 'rgba(247,147,30,0.14)',
                border: '2px solid #FEF7EE',
                color: '#F7931E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10.5, fontWeight: 800, padding: '0 6px', flexShrink: 0,
              }}
            >
              +{overflowCount}
            </div>
          )}
        </div>
        {friendsAvgScore && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '6px 11px', borderRadius: 12,
            background: 'rgba(247,147,30,0.12)',
          }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#F7931E', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {friendsAvgScore}
            </span>
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', color: '#F7931E', opacity: 0.75, marginTop: 2, textTransform: 'uppercase' }}>
              Avg
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
