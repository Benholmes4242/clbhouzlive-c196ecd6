import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { useGolferActions } from '../hooks/useGolferActions';
import { formatDistance } from '../distance';
import { GolferAvatar } from './GolferAvatar';
import './nearby.css';
import '../../hub/pages/nearbyGolfers.css';

interface NearbyGolferCardProps {
  golfer: {
    id: string;
    display_name: string;
    username?: string;
    home_club?: string;
    avatar_url?: string;
    is_online: boolean;
    isMock?: boolean;
    distanceText?: string;
    distance_km?: number;
    isOpenToPlay?: boolean;
    sameHomeClub?: boolean;
    is_following?: boolean;
    handicap?: number;
  };
  index: number;
}

export function NearbyGolferCard({ golfer, index }: NearbyGolferCardProps) {
  const { sendFriendRequest, toggleFollow, openMessage, isFollowing } = useGolferActions(
    golfer.id, 
    golfer.is_following, 
    index
  );
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.setAttribute('data-inview', '1');
      },
      { rootMargin: '50px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleViewProfile = () => {
    haptic('light');
    console.log('View profile:', golfer.display_name);
  };

  const distanceText = golfer.distanceText || 
    (golfer.distance_km ? formatDistance(golfer.distance_km * 1000) : undefined);

  return (
    <article
      ref={ref}
      className="golfer-card apple-glass-panel"
      role="article"
      aria-label={`${golfer.display_name}, handicap ${golfer.handicap ? golfer.handicap.toFixed(1).replace('.', ' point ') : 'unknown'}, ${golfer.home_club || 'No home club'}, ${distanceText ? distanceText.replace('m', 'meters').replace('km', 'kilometers') : ''}, ${golfer.isOpenToPlay ? 'open to play' : ''}`}
      style={{
        animation: `rowFadeUp 90ms ease-out both ${index * 35}ms`,
      }}
    >
      {/* Main info area */}
      <TapButton
        className="golfer-info"
        onPointerDown={handleViewProfile}
        aria-label={`View ${golfer.display_name}'s profile`}
      >
        <GolferAvatar
          avatarUrl={golfer.avatar_url}
          displayName={golfer.display_name}
          size={48}
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="golfer-name">{golfer.display_name}</h3>
          <p className="golfer-meta">
            {golfer.handicap !== undefined && `HCP ${golfer.handicap.toFixed(1)}`}
            {golfer.handicap !== undefined && golfer.home_club && ' • '}
            {golfer.home_club}
            {(golfer.home_club || golfer.handicap !== undefined) && distanceText && ' • '}
            {distanceText}
          </p>
        </div>
      </TapButton>

      {/* Status chip */}
      {golfer.isOpenToPlay && (
        <span className="golfer-status">Open to play</span>
      )}

      {/* Action buttons */}
      <div className="golfer-actions">
        <button
          onClick={() => {
            haptic('light');
            sendFriendRequest();
          }}
          aria-label={`Send friend request to ${golfer.display_name}`}
        >
          Friend
        </button>

        <button
          onClick={() => {
            haptic('light');
            toggleFollow();
          }}
          aria-label={isFollowing ? `Unfollow ${golfer.display_name}` : `Follow ${golfer.display_name}`}
          aria-pressed={isFollowing}
          style={
            isFollowing
              ? {
                  background: 'rgba(76,220,151,0.18)',
                  borderColor: 'rgba(76,220,151,0.3)',
                  color: '#4cdc97',
                }
              : undefined
          }
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>

        <button
          onClick={() => {
            haptic('light');
            openMessage();
          }}
          aria-label={`Message ${golfer.display_name}`}
        >
          Message
        </button>
      </div>
    </article>
  );
}
