import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { useGolferActions } from '../hooks/useGolferActions';
import { formatDistance } from '../distance';

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

function StatusChip({ 
  icon, 
  label, 
  tone = 'default' 
}: {
  icon: string;
  label: string;
  tone?: 'success' | 'default';
}) {
  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-2xl text-[13px] font-semibold backdrop-blur-[20px] border transition-all duration-200`}
      style={{
        padding: '4px 10px',
        borderRadius: '16px',
        animation: 'chipAppear 120ms ease-out both',
        ...(tone === 'success' 
          ? {
              background: 'linear-gradient(180deg, rgba(76,220,151,0.45), rgba(0,0,0,0.25))',
              color: '#4cdc97',
              borderColor: 'rgba(76,220,151,0.25)'
            }
          : {
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.90)',
              borderColor: 'rgba(255,255,255,0.15)'
            })
      }}
    >
      <span className="text-[14px] leading-none">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function PresenceRing({ status }: { status: 'openToPlay' | 'online' | 'offline' }) {
  const colors = {
    openToPlay: '#4ADE80',
    online: '#3B82F6',
    offline: 'rgba(255,255,255,0.25)'
  };
  
  const shouldPulse = status === 'openToPlay';
  
  return (
    <svg 
      className="absolute inset-0 w-full h-full" 
      style={{ overflow: 'visible' }}
    >
      <circle
        cx="50%"
        cy="50%"
        r="48%"
        fill="none"
        stroke={colors[status]}
        strokeWidth="2.5"
        style={{
          filter: shouldPulse ? 'drop-shadow(0 0 3px rgba(74,222,128,0.4))' : 'none'
        }}
        className={shouldPulse ? 'animate-[presencePulse_900ms_ease-in-out_infinite]' : ''}
      />
      {/* Mini dot indicator */}
      <circle
        cx="85%"
        cy="85%"
        r="4"
        fill={colors[status]}
        className={shouldPulse ? 'animate-[presencePulse_900ms_ease-in-out_infinite]' : ''}
      />
    </svg>
  );
}

export function NearbyGolferCard({ golfer, index }: NearbyGolferCardProps) {
  const { sendFriendRequest, toggleFollow, openMessage, isFollowing } = useGolferActions(
    golfer.id, 
    golfer.is_following, 
    index
  );

  const handleViewProfile = () => {
    haptic('light');
    console.log('View profile:', golfer.display_name);
  };

  const distanceText = golfer.distanceText || 
    (golfer.distance_km ? formatDistance(golfer.distance_km * 1000) : undefined);

  const presenceStatus = golfer.isOpenToPlay ? 'openToPlay' : golfer.is_online ? 'online' : 'offline';

  return (
    <article
      className="rounded-[18px] backdrop-blur-[20px] border mx-3"
      style={{
        background: 'rgba(255, 255, 255, 0.07)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        padding: '16px 14px',
        animation: `rowFadeUp 90ms ease-out both ${index * 35}ms`,
        contentVisibility: 'auto',
        containIntrinsicSize: '0 140px'
      }}
      role="article"
      aria-label={`${golfer.display_name}, handicap ${golfer.handicap ? golfer.handicap.toFixed(1).replace('.', ' point ') : 'unknown'}, ${golfer.home_club || 'No home club'}, ${distanceText ? distanceText.replace('m', 'meters').replace('km', 'kilometers') : ''}, ${golfer.isOpenToPlay ? 'open to play' : ''}`}
    >
      {/* Main tappable area with min 44px touch target */}
      <TapButton
        className="flex items-start gap-3 w-full text-left transition-transform active:scale-[0.97] duration-[85ms]"
        style={{ minHeight: '44px' }}
        onPointerDown={handleViewProfile}
        aria-label={`View ${golfer.display_name}'s profile`}
      >
        {/* Avatar with presence ring */}
        <div className="relative shrink-0 w-[52px] h-[52px]">
          <PresenceRing status={presenceStatus} />
          <div className="absolute inset-[3px] rounded-full overflow-hidden">
            <img
              src={golfer.avatar_url || '/placeholder.svg'}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

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
            <div className="flex flex-wrap gap-1.5">
              {/* Show max 2 chips */}
              {golfer.isOpenToPlay && (
                <StatusChip icon="🟢" label="Open to play" tone="success" />
              )}
              {golfer.sameHomeClub && (
                <StatusChip icon="🏠" label="Same home club" />
              )}
              {/* In real implementation, if more than 2 chips, show +N */}
            </div>
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
          aria-label="Send friend request"
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
          aria-label={isFollowing ? 'Unfollow' : 'Follow'}
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
          aria-label="Message"
        >
          Message
        </TapButton>
      </div>
    </article>
  );
}
