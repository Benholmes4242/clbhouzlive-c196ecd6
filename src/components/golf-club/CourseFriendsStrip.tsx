import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface CourseFriendsStripProps {
  courseId: string;
  courseName: string;
}

export const CourseFriendsStrip: React.FC<CourseFriendsStripProps> = ({ courseId }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();

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

  const subtitle = friendsAvgScore
    ? `${totalFriends} friends played · Avg ${friendsAvgScore}`
    : `${totalFriends} ${totalFriends === 1 ? 'friend' : 'friends'} played here`;

  return (
    <button
      type="button"
      onClick={() => navigate('/golferssharedcourses')}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.07)',
        borderRadius: 12,
        margin: '0 16px',
        boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
        cursor: 'pointer',
        textAlign: 'left',
        width: 'calc(100% - 32px)',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
          Friends who've played here
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{subtitle}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex' }}>
          {visibleFriends.map((friend, index) => {
            const displayName = friend.profile.display_name || friend.profile.username || '?';
            const initial = displayName[0]?.toUpperCase() || '?';

            return friend.profile.profile_photo_url ? (
              <SquircleAvatar
                key={friend.user_id}
                src={friend.profile.profile_photo_url}
                alt={displayName}
                size={28}
                className={index > 0 ? '-ml-1.5' : ''}
              />
            ) : (
              <div
                key={friend.user_id}
                className={index > 0 ? '-ml-1.5' : ''}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#3B82F6',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  border: '2px solid #F8FAFC',
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
            );
          })}

          {overflowCount > 0 && (
            <div
              className="-ml-1.5"
              style={{
                minWidth: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(15,23,42,0.06)',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                padding: '0 6px',
                border: '2px solid #F8FAFC',
                flexShrink: 0,
              }}
            >
              +{overflowCount}
            </div>
          )}
        </div>

        <span style={{ fontSize: 16, color: '#CBD5E1', marginLeft: 4 }}>›</span>
      </div>
    </button>
  );
};
