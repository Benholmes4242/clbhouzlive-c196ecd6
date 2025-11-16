import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { hapticTap } from '@/lib/ui/haptics';
import { useGolferActions } from '../hooks/useGolferActions';
import { formatDistance } from '../distance';
import { GolferAvatar } from './GolferAvatar';
import { StatusChips } from './StatusChips';
import { GlassCard } from '@/components/shared/GlassCard';
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
    <div
      className="px-4 pt-4 pb-5 rounded-2xl backdrop-blur-sm border"
      style={{
        background: 'var(--hub-glass-bg-card)',
        borderColor: 'var(--hub-stroke)',
        animation: `rowFadeUp 90ms ease-out both ${index * 35}ms`,
      }}
    >
      <article
        ref={ref}
        role="article"
        aria-label={`${golfer.display_name}, handicap ${golfer.handicap ? golfer.handicap.toFixed(1).replace('.', ' point ') : 'unknown'}, ${golfer.home_club || 'No home club'}, ${distanceText ? distanceText.replace('m', 'meters').replace('km', 'kilometers') : ''}, ${golfer.isOpenToPlay ? 'open to play' : ''}`}
        onPointerDown={() => hapticTap()}
        tabIndex={0}
      >
        {/* Main tappable area with min 44px touch target */}
        <TapButton
          className="flex items-start gap-3 w-full text-left transition-transform active:scale-[0.97] duration-100"
          style={{ minHeight: '44px' }}
          onPointerDown={handleViewProfile}
          aria-label={`View ${golfer.display_name}'s profile`}
        >
          {/* Avatar */}
          <GolferAvatar
            avatarUrl={golfer.avatar_url}
            displayName={golfer.display_name}
            size={72}
          />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-[3px]">
            {/* Name line */}
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold truncate" style={{ color: 'var(--hub-text)' }}>
                {golfer.display_name}
              </h3>
            </div>
            
            {/* Meta line */}
            <div 
              className="flex items-center gap-1.5 text-[13px]"
              style={{ 
                fontFeatureSettings: '"tnum"',
                color: 'var(--hub-text-sub)'
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
                <span className="shrink-0 tabular-nums" style={{ color: 'var(--hub-text-muted)' }}>{distanceText}</span>
              )}
            </div>

            {/* Status chips - only show when true */}
            {(golfer.sameHomeClub || golfer.isOpenToPlay === true) && (
              <StatusChips
                sameHomeClub={golfer.sameHomeClub}
                isOpenToPlay={golfer.isOpenToPlay === true}
              />
            )}
          </div>
        </TapButton>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 h-[40px] rounded-[14px] border bg-white/[0.02] text-[14px] font-medium shadow-[0_1px_0_rgba(255,255,255,0.04)] transition-all duration-[120ms] hover:bg-white/[0.06] active:scale-[0.97] active:bg-white/[0.09]"
            style={{ color: 'var(--hub-text-body)', borderColor: 'var(--hub-stroke)' }}
            onClick={() => {
              haptic('light');
              sendFriendRequest();
            }}
            aria-label={`Send friend request to ${golfer.display_name}`}
          >
            Friend
          </button>

          <button
            className={`flex-1 h-[40px] rounded-[14px] border text-[14px] font-medium shadow-[0_1px_0_rgba(255,255,255,0.04)] transition-all duration-[120ms] active:scale-[0.97] ${
              isFollowing
                ? 'bg-emerald-500/18 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/24 active:bg-emerald-500/26'
                : 'bg-transparent hover:bg-white/[0.06] active:bg-white/[0.09]'
            }`}
            style={isFollowing ? undefined : { color: 'var(--hub-text-body)', borderColor: 'var(--hub-stroke)' }}
            onClick={() => {
              haptic('light');
              toggleFollow();
            }}
            aria-label={isFollowing ? `Unfollow ${golfer.display_name}` : `Follow ${golfer.display_name}`}
            aria-pressed={isFollowing}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>

          <button
            className="flex-1 h-[40px] rounded-[14px] border bg-transparent text-[14px] font-medium shadow-[0_1px_0_rgba(255,255,255,0.04)] transition-all duration-[120ms] hover:bg-white/[0.06] active:scale-[0.97] active:bg-white/[0.09]"
            style={{ color: 'var(--hub-text-body)', borderColor: 'var(--hub-stroke)' }}
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
    </div>
  );
}
