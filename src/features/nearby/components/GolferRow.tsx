import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { useGolferActions } from '../hooks/useGolferActions';
import { formatDistance } from '../distance';

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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold ${
        tone === 'success'
          ? 'bg-[#162219] text-[#cfe8d6] shadow-[inset_0_0_0_1px_#325A3E]'
          : 'bg-[#171717] text-[#d6d6d6] shadow-[inset_0_0_0_1px_#2a2a2a]'
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
    <li>
      <button 
        className="w-full flex items-center gap-3 py-3 px-2 text-left hover:bg-white/[0.03] rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
        onClick={handleViewProfile}
        aria-label={`View ${golfer.display_name}'s profile. ${golfer.home_club || 'No home club'}${distanceText ? `, ${distanceText} away` : ''}`}
      >
        {/* Avatar */}
        <img
          src={golfer.avatar_url || '/placeholder.svg'}
          className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--hub-stroke)]/40"
          alt=""
        />
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="truncate font-medium text-[var(--hub-text)]">{golfer.display_name}</p>
            <svg className="h-4 w-4 opacity-70 text-[var(--hub-text-dim)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="mt-0.5 text-[13px] text-[var(--hub-text-sub)]">
            {golfer.home_club && <span>{golfer.home_club}</span>}
            {golfer.home_club && distanceText && <span aria-hidden> • </span>}
            {distanceText && <span>{distanceText}</span>}
          </p>
          
          {/* Badges */}
          {(golfer.sameHomeClub || golfer.isOpenToPlay) && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {golfer.sameHomeClub && (
                <Badge icon="🏠" label="Same club" />
              )}
              {golfer.isOpenToPlay && (
                <Badge icon="🟢" label="Open to play" tone="success" />
              )}
            </div>
          )}
        </div>
      </button>
    </li>
  );
}
