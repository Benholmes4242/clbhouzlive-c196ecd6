/**
 * HubHeaderRowV3 - Minimal header for Event-Led Hub
 * Left: Greeting (shorter format)
 * Right: Profile avatar (squircle)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

export function HubHeaderRowV3() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);

  const handleProfileClick = () => {
    haptic('light');
    navigate('/profile');
  };

  const avatarUrl = profile?.profile_photo_url || null;
  const displayName = profile?.display_name || 'Golfer';
  const firstName = displayName.split(' ')[0];

  // Get greeting based on time of day - shorter format with exclamation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <header 
      className="flex items-center justify-between h-14"
      style={{ 
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      {/* Greeting - refined typography with shorter format */}
      <div 
        className="font-semibold tracking-tight"
        style={{ 
          color: '#1e293b',
          fontSize: '18px',
          letterSpacing: '-0.3px',
        }}
      >
        {getGreeting()}, {firstName}!
      </div>

      {/* Profile Avatar - squircle style */}
      <button
        onClick={handleProfileClick}
        className="flex-shrink-0 transition-all duration-150 active:scale-[0.95]"
        aria-label="Profile"
      >
        <SquircleAvatar
          size={40}
          src={avatarUrl}
          alt="Profile"
          fallback={displayName.charAt(0).toUpperCase()}
          thinRing
        />
      </button>
    </header>
  );
}
