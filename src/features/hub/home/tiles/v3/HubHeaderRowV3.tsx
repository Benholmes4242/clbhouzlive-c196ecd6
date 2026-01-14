/**
 * HubHeaderRowV3 - Minimal header for Event-Led Hub
 * Left: Clbhouz wordmark
 * Right: Profile avatar (circular)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { haptic } from '@/utils/haptics';

export function HubHeaderRowV3() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);

  const handleProfileClick = () => {
    haptic('light');
    navigate('/profile');
  };

  const avatarUrl = profile?.profile_photo_url || null;
  const initials = profile?.display_name 
    ? profile.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header 
      className="flex items-center justify-between h-14"
      style={{ 
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      {/* Wordmark */}
      <div 
        className="font-bold tracking-tight"
        style={{ 
          color: 'var(--hub-text)',
          fontSize: '22px',
          letterSpacing: '-0.5px',
        }}
      >
        clbhouz
      </div>

      {/* Profile Avatar */}
      <button
        onClick={handleProfileClick}
        className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-[0.95]"
        style={{
          background: avatarUrl ? 'transparent' : 'var(--hub-surface-2)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-soft)',
          overflow: 'hidden',
        }}
        aria-label="Profile"
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Profile" 
            className="h-full w-full object-cover"
          />
        ) : (
          <span 
            className="text-[11px] font-semibold"
            style={{ color: 'var(--hub-text-dim)' }}
          >
            {initials}
          </span>
        )}
      </button>
    </header>
  );
}
