/**
 * HubHeaderToday - Dynamic "Today" Header (Fixed Height ~60px)
 * Shows personalized greeting + next game info
 * Truncates course names to prevent wrapping
 */

import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserGames } from '@/features/hub/hooks/useUserGames';
import { format } from 'date-fns';

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
  const { data: gamesData } = useUserGames();

  const firstName = getFirstName(profile?.display_name);
  const greeting = getGreeting();

  // Find the next upcoming game
  const nextGame = React.useMemo(() => {
    if (!gamesData) return null;
    const allGames = [...(gamesData.hosting || []), ...(gamesData.joined || [])];
    const now = new Date();
    
    const upcoming = allGames
      .filter(g => new Date(g.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    return upcoming[0] || null;
  }, [gamesData]);

  // Build the subline - "What's up next · {course} · {date}" or empty state
  const subline = React.useMemo(() => {
    if (!nextGame) {
      return "What's up next · No games planned yet";
    }

    const gameDate = new Date(nextGame.start_time);
    const courseName = nextGame.course_name || 'TBD';
    const formattedDate = format(gameDate, 'MMM d');
    
    return `What's up next · ${courseName} · ${formattedDate}`;
  }, [nextGame]);

  return (
    <div className="h-[60px] flex flex-col justify-center px-1 mb-[-2px]">
      <h1 
        className="text-[23px] font-medium leading-tight truncate tracking-[0.01em]"
        style={{ color: 'var(--hub-text)' }}
      >
        {greeting}, {firstName}
      </h1>
      <p 
        className="text-[13px] mt-2.5 truncate tracking-[0.02em]"
        style={{ color: 'var(--hub-text-sub)', opacity: 0.75 }}
      >
        {subline}
      </p>
    </div>
  );
}
