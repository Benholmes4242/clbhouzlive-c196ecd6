import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { hapticTap } from '@/lib/ui/haptics';
import { useGolferActions } from '../hooks/useGolferActions';
import { formatDistance } from '../distance';
import { GolferAvatar } from './GolferAvatar';
import { StatusChips } from './StatusChips';
import './nearby.css';

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
      className="golfer-card rounded-[18px] backdrop-blur-[20px] border mx-3"
      style={{
        background: 'rgba(255, 255, 255, 0.07)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        padding: '16px 14px',
        animation: `rowFadeUp 90ms ease-out both ${index * 35}ms`,
      }}
      role="article"
      aria-label={`${golfer.display_name}, handicap ${golfer.handicap ? golfer.handicap.toFixed(1).replace('.', ' point ') : 'unknown'}, ${golfer.home_club || 'No home club'}, ${distanceText ? distanceText.replace('m', 'meters').replace('km', 'kilometers') : ''}, ${golfer.isOpenToPlay ? 'open to play' : ''}`}
      onPointerDown={() => hapticTap()}
      tabIndex={0}
    >
      {/* Main tappable area with min 44px touch target */}
      <TapButton
        className="flex items-start gap-3 w-full text-left transition-transform active:scale-[0.97] duration-[85ms]"
        style={{ minHeight: '44px' }}
        onPointerDown={handleViewProfile}
        aria-label={`View ${golfer.display_name}'s profile`}
      >
        {/* Avatar */}
        <GolferAvatar
          avatarUrl={golfer.avatar_url}
          displayName={golfer.display_name}
          size={48}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name line */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[17px] font-semibold text-white truncate">
              {golfer.display_name}
            </h3>
          </div>
          
          {/* Meta line with pills */}
          <div 
            className="flex items-center gap-1.5 text-[14px] text-white/70"
            style={{ 
              fontFeatureSettings: '"tnum"',
              marginBottom: '8px'
            }}
          >
            {golfer.handicap !== undefined && (
              <>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[13px] font-semibold">
                  HCP {golfer.handicap.toFixed(1)}
                </span>
                <span className="text-white/40">•</span>
              </>
            )}
            {golfer.home_club && (
              <>
                <span className="truncate">{golfer.home_club}</span>
                {distanceText && <span className="text-white/40">•</span>}
              </>
            )}
            {distanceText && (
              <span className="shrink-0 tabular-nums">{distanceText}</span>
            )}
          </div>

          {/* Status chips - max 2 visible with overflow */}
          {(golfer.sameHomeClub || golfer.isOpenToPlay) && (
            <StatusChips
              sameHomeClub={golfer.sameHomeClub}
              isOpenToPlay={golfer.isOpenToPlay}
            />
          )}
        </div>
      </TapButton>

      {/* Action buttons - equal width */}
      <div className="flex gap-2" style={{ marginTop: '10px' }}>
        <TapButton
          className="flex-1 rounded-xl backdrop-blur-[20px] border font-medium text-[13px] transition-all duration-[85ms] active:scale-[0.97]"
          style={{
            background: 'rgba(255,255,255,0.18)',
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.96)',
            minHeight: '44px',
            height: '36px'
          }}
          onPointerDown={() => {
            haptic('light');
            sendFriendRequest();
          }}
          aria-label={`Send friend request to ${golfer.display_name}`}
        >
          Friend
        </TapButton>

        <TapButton
          className="flex-1 rounded-xl backdrop-blur-[20px] border font-medium text-[13px] transition-all duration-[85ms] active:scale-[0.97]"
          style={
            isFollowing
              ? {
                  background: 'rgba(76,220,151,0.18)',
                  borderColor: 'rgba(76,220,151,0.3)',
                  color: '#4cdc97',
                  minHeight: '44px',
                  height: '36px'
                }
              : {
                  background: 'transparent',
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.88)',
                  minHeight: '44px',
                  height: '36px'
                }
          }
          onPointerDown={() => {
            haptic('light');
            toggleFollow();
          }}
          aria-label={isFollowing ? `Unfollow ${golfer.display_name}` : `Follow ${golfer.display_name}`}
          aria-pressed={isFollowing}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </TapButton>

        <TapButton
          className="flex-1 rounded-xl backdrop-blur-[20px] border font-medium text-[13px] transition-all duration-[85ms] active:scale-[0.97]"
          style={{
            background: 'transparent',
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.88)',
            minHeight: '44px',
            height: '36px'
          }}
          onPointerDown={() => {
            haptic('light');
            openMessage();
          }}
          aria-label={`Message ${golfer.display_name}`}
        >
          Message
        </TapButton>
      </div>
    </article>
  );
}
