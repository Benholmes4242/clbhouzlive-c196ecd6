import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatDistanceToNow } from 'date-fns';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';
import type { CourseWithFriends } from '@/hooks/useFriendsCourses';

interface FriendsHeroCourseCardProps {
  course: CourseWithFriends;
  filterType: string;
}

const FriendsHeroCourseCard: React.FC<FriendsHeroCourseCardProps> = ({ course }) => {
  const navigate = useNavigate();
  const ranks = extractRanksFromMemberships(course.top100_memberships, course.country);
  const primaryRank = ranks.globalRank || ranks.usaRank || ranks.regionalRank || null;

  return (
    <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
      {/* Section rule marker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px 0', marginBottom: '10px' }}>
        <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: '11px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Hottest Course This Period
        </span>
      </div>

      {/* Course row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderTop: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer' }}
        onClick={() => navigate(`/courses/${course.course_id}`)}
        className="active:opacity-80 transition-opacity"
      >
        {/* Thumbnail */}
        <div style={{ width: 56, height: 56, borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)', border: '1px solid rgba(15,23,42,0.07)', position: 'relative' }}>
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.course_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px' }}>⛳</span>
            </div>
          )}
          {primaryRank && (
            <div style={{ position: 'absolute', top: 3, left: 3, background: '#F7931E', borderRadius: 4, padding: '1px 4px' }}>
              <span style={{ fontSize: '8px', fontWeight: 900, color: '#fff' }}>#{primaryRank}</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {course.course_name}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
            {course.country}{course.sub_country ? `, ${course.sub_country}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {course.total_friends_played}
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px' }}>friends played</div>
        </div>
      </div>

      {/* Friends who played — flat rows */}
      {course.friends.map((friend) => {
        const name = friend.friend_profile.display_name || friend.friend_profile.username;
        return (
          <div
            key={friend.friend_id}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px', borderTop: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); navigate(`/user/${friend.friend_profile.username}`); }}
            className="active:opacity-70 transition-opacity"
          >
            <SquircleAvatar size={28} src={friend.friend_profile.profile_photo_url} alt={name} fallback={name.charAt(0)} hideRing />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {name}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', flexShrink: 0 }}>
              {formatDistanceToNow(new Date(friend.played_at), { addSuffix: true })}
            </div>
          </div>
        );
      })}
      <div style={{ height: '4px' }} />
    </div>
  );
};

export default FriendsHeroCourseCard;
