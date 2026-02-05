/**
 * HubHeaderToday V2 - Premium greeting with V2 pill-style home button
 * Tighter spacing, responsive sizing
 */

import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHub } from '@/features/hub/useHub';
import { haptic } from '@/utils/haptics';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(displayName: string | null | undefined): string {
  if (!displayName) return 'there';
  return displayName.split(' ')[0];
}

export function HubHeaderToday() {
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const { close } = useHub();
  const navigate = useNavigate();

  const firstName = getFirstName(profile?.display_name);
  const greeting = getGreeting();

  const handleHomeAction = () => {
    haptic('light');
    close();
    navigate('/clubhouse');
  };

  return (
    <header className="pt-2 pb-2" style={{ overflow: 'visible' }}>
      <div className="flex items-center justify-between gap-3">
        {/* Greeting - Premium typography with refined weight */}
        <div 
          className="flex flex-col min-w-0"
          style={{ 
            color: 'var(--hub-text)',
            letterSpacing: '-0.4px',
          }}
        >
          <span 
            className="font-bold"
            style={{ fontSize: 'clamp(20px, 5.5vw, 24px)', lineHeight: '1.2' }}
          >
            {greeting},
          </span>
          <span 
            className="font-bold truncate"
            style={{ fontSize: 'clamp(20px, 5.5vw, 24px)', lineHeight: '1.2' }}
          >
            {firstName}
          </span>
        </div>

        {/* V3 Premium home button - refined glass effect with inner highlight */}
        <button
          className="h-11 w-11 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-150 active:scale-[0.96]"
          style={{
            background: 'var(--hub-surface)',
            border: '1px solid var(--hub-stroke)',
            boxShadow: '0 4px 14px rgba(2, 6, 23, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
          }}
          onClick={handleHomeAction}
          aria-label="Home"
        >
          <Home className="h-[19px] w-[19px]" style={{ color: 'var(--hub-text-dim)' }} />
        </button>
      </div>
    </header>
  );
}
