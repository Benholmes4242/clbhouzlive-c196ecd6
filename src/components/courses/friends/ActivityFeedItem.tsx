import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

interface ActivityFeedItemProps {
  hit: FriendCourseHit;
  isTrending?: boolean;
  index?: number;
}

const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ hit }) => {
  const navigate = useNavigate();
  const friendName = hit.friend_profile.display_name || hit.friend_profile.username;

  const handleFriendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${hit.friend_profile.username}`);
  };

  const handleCourseClick = () => {
    navigate(`/courses/${hit.course_id}`);
  };

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer' }}
      onClick={handleCourseClick}
      className="active:opacity-80 transition-opacity"
    >
      {/* Friend avatar */}
      <button onClick={handleFriendClick} style={{ flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <SquircleAvatar size={34} src={hit.friend_profile.profile_photo_url} alt={friendName} fallback={friendName.charAt(0)} hideRing />
      </button>

      {/* Course info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {friendName}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginTop: '1px' }}>
          {hit.course_name}
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
          {hit.course_country}{hit.course_sub_country ? `, ${hit.course_sub_country}` : ''} · {formatDistanceToNow(new Date(hit.played_at), { addSuffix: true })}
        </div>
      </div>

      {/* Thumbnail + rating */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(15,23,42,0.07)', background: 'rgba(15,23,42,0.04)' }}>
          {hit.thumbnail_url ? (
            <img src={hit.thumbnail_url} alt={hit.course_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '18px' }}>⛳</span>
            </div>
          )}
        </div>
        {hit.rating != null && (
          <span style={{ fontSize: '11px', fontWeight: 800, color: hit.rating >= 9.0 ? '#F7931E' : '#64748B', fontVariantNumeric: 'tabular-nums' }}>
            {hit.rating.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActivityFeedItem;
