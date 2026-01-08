/**
 * HubHeaderToday - Thicker greeting with right circle button
 * No subtitle - just the greeting
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
    <header className="px-1 pt-5">
      <div className="flex items-center justify-between">
        <h1 
          className="text-[28px] font-extrabold leading-[1.05] tracking-[-0.01em]"
          style={{ color: 'var(--hub-text)' }}
        >
          {greeting}, {firstName}
        </h1>

        <button
          className="h-11 w-11 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
          onClick={handleHomeAction}
          aria-label="Home"
        >
          <Home className="h-5 w-5" style={{ color: 'var(--hub-text)' }} />
        </button>
      </div>
    </header>
  );
}
