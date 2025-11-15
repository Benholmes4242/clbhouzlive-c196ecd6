import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { useGolferActions } from '../hooks/useGolferActions';
import { formatDistance } from '../distance';
import AvatarSquircle from '@/components/ui/AvatarSquircle';

interface GolferRowProps {
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
  };
  index: number;
}

function Badge({ 
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold liquid-glass ${
        tone === 'success'
          ? 'text-[#cfe8d6] shadow-[inset_0_0_0_1px_rgba(110,146,119,0.4)]'
          : 'text-white/90'
      }`}
    >
      <span className="text-[14px] leading-none">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

export function GolferRow({ golfer, index }: GolferRowProps) {
  const { sendFriendRequest, toggleFollow, openMessage, isFollowing } = useGolferActions(golfer.id, golfer.is_following, index);

  const handleViewProfile = () => {
    haptic('light');
    // TODO: Open mini-profile/details
    console.log('View profile:', golfer.display_name);
  };

  const distanceText = golfer.distanceText || 
    (golfer.distance_km ? formatDistance(golfer.distance_km * 1000) : undefined);

  return (
    <article
      className="rounded-2xl p-3 mx-3 my-2.5 liquid-glass liquid-glass--elevated"
      role="article"
      aria-label={`${golfer.display_name}, ${golfer.home_club || 'No home club'}, ${distanceText || ''}`}
    >
      {/* Main tappable area */}
      <TapButton
        className="flex items-center gap-3 w-full text-left transition-transform active:scale-[0.98]"
        onPointerDown={handleViewProfile}
        aria-label={`View ${golfer.display_name}'s profile`}
      >
        {/* Avatar with optional open-to-play ring */}
        <div 
          className={`relative shrink-0 ${
            golfer.isOpenToPlay ? 'shadow-[0_0_0_3px_rgba(110,146,119,0.5)] rounded-[14px]' : ''
          }`}
        >
          <AvatarSquircle
            src={golfer.avatar_url}
            alt={golfer.display_name}
            fallback={golfer.display_name}
            size={44}
            ringWidth={0}
          />
        </div>

        {/* Name, club, badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[16px] font-bold text-white truncate">
              {golfer.display_name}
            </span>
            {distanceText && (
              <span className="ml-auto text-[#a0a0a0] text-[14px] tabular-nums shrink-0">
                {distanceText}
              </span>
            )}
          </div>
          
          {golfer.home_club && (
            <div className="text-[13px] text-[#b5b5b5] mb-2 truncate">
              {golfer.home_club}
            </div>
          )}

          {(golfer.sameHomeClub || golfer.isOpenToPlay) && (
            <div className="flex flex-wrap gap-1.5">
              {golfer.sameHomeClub && (
                <Badge icon="🏠" label="Same home club" />
              )}
              {golfer.isOpenToPlay && (
                <Badge icon="🟢" label="Open to play" tone="success" />
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <span className="text-[#777] text-xl shrink-0" aria-hidden="true">›</span>
      </TapButton>

      {/* Action CTAs */}
      <div className="flex gap-2.5 mt-3">
        <TapButton
          className="flex-1 h-10 rounded-xl liquid-glass text-white/90 transition-transform active:scale-[0.98] font-medium text-[13px]"
          onPointerDown={() => {
            haptic('light');
            sendFriendRequest();
          }}
          aria-label="Send friend request"
        >
          Friend Request
        </TapButton>

        <TapButton
          className={`flex-1 h-10 rounded-xl font-medium text-[13px] transition-transform active:scale-[0.98] liquid-glass ${
            isFollowing
              ? 'text-[#e7f3ea] shadow-[inset_0_0_0_1px_rgba(110,146,119,0.4)]'
              : 'text-white/90'
          }`}
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
          className="flex-1 h-10 rounded-xl liquid-glass text-white/90 transition-transform active:scale-[0.98] font-medium text-[13px]"
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
