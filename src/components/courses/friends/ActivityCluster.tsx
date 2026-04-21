import React, { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

interface ActivityClusterProps {
  courseId: string;
  courseName: string;
  thumbnailUrl: string | null;
  friends: FriendCourseHit[];
  mostRecentPlayedAt: string;
  communityRating?: number | null;
  index?: number;
}

const ActivityCluster: React.FC<ActivityClusterProps> = ({
  courseId,
  courseName,
  thumbnailUrl,
  friends,
  mostRecentPlayedAt,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const sortedFriends = [...friends].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  );

  const handleCourseClick = () => navigate(`/courses/${courseId}`);
  const handleFriendClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${username}`);
  };
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
      {/* Main cluster row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', cursor: 'pointer' }}
        onClick={handleCourseClick}
        className="active:opacity-80 transition-opacity"
      >
        {/* Stacked avatars */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {sortedFriends.slice(0, 2).map((f, idx) => (
            <div key={f.friend_id} style={{ marginLeft: idx > 0 ? '-8px' : 0, zIndex: 2 - idx }}>
              <SquircleAvatar
                size={34}
                src={f.friend_profile.profile_photo_url}
                alt={f.friend_profile.display_name || f.friend_profile.username}
                fallback={(f.friend_profile.display_name || f.friend_profile.username || '?').charAt(0)}
                hideRing
              />
            </div>
          ))}
        </div>

        {/* Course info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>
            <span style={{ color: '#F7931E', fontWeight: 900 }}>{friends.length} friends</span> played
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginTop: '1px' }}>
            {courseName}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
            {formatDistanceToNow(new Date(mostRecentPlayedAt), { addSuffix: true })}
          </div>
        </div>

        {/* Thumbnail + expand toggle */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(15,23,42,0.07)', background: 'rgba(15,23,42,0.04)' }}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={courseName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px' }}>⛳</span>
              </div>
            )}
          </div>
          <button
            onClick={toggleExpand}
            style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {isExpanded ? 'hide ▴' : 'show ▾'}
          </button>
        </div>
      </div>

      {/* Expanded friend rows */}
      {isExpanded && sortedFriends.map((friend) => {
        const name = friend.friend_profile.display_name || friend.friend_profile.username;
        return (
          <button
            key={`${friend.friend_id}-${friend.played_at}`}
            onClick={(e) => handleFriendClick(friend.friend_profile.username, e)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 20px 8px 36px', borderTop: '0.5px solid rgba(15,23,42,0.07)', background: 'rgba(247,147,30,0.02)', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
            className="active:opacity-70 transition-opacity"
          >
            <SquircleAvatar size={26} src={friend.friend_profile.profile_photo_url} alt={name} userId={friend.friend_id} hideRing />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {name}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                {formatDistanceToNow(new Date(friend.played_at), { addSuffix: true })}
              </div>
            </div>
            {friend.rating != null && (
              <span style={{ fontSize: '12px', fontWeight: 800, color: friend.rating >= 9.0 ? '#F7931E' : '#64748B', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {friend.rating.toFixed(1)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ActivityCluster;
