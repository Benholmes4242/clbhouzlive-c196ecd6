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
    <header className="pt-1 pb-2">
      <div className="flex items-center justify-between gap-3">
        {/* Greeting - V2 responsive sizing with tighter tracking + line-height */}
        <h1 
          className="font-semibold truncate"
          style={{ 
            color: 'var(--hub-text)',
            fontSize: 'clamp(18px, 5vw, 22px)',
            maxWidth: '75%',
            lineHeight: '1.25', // Allow room for descenders (g, y, p, etc.)
            letterSpacing: '-0.2px',
          }}
        >
          {greeting}, {firstName}
        </h1>

        {/* V2 Pill-style home button - soft surface + subtle border + shadow */}
        <button
          className="h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-150 active:scale-[0.97]"
          style={{
            background: 'var(--hub-surface)',
            border: '1px solid var(--hub-stroke)',
            boxShadow: 'var(--hub-shadow-soft)',
          }}
          onClick={handleHomeAction}
          aria-label="Home"
        >
          <Home className="h-[18px] w-[18px]" style={{ color: 'var(--hub-text-dim)' }} />
        </button>
      </div>
    </header>
  );
}
