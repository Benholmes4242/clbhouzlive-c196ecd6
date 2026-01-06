/**
 * HubHeaderToday - Dynamic "Today" Header
 * Shows personalized greeting + next game info
 */

import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserGames } from '@/features/hub/hooks/useUserGames';
import { differenceInDays, isToday, isTomorrow, format } from 'date-fns';

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

  // Build the subline
  const subline = React.useMemo(() => {
    if (!nextGame) {
      return "No games planned — fancy one this week?";
    }

    const gameDate = new Date(nextGame.start_time);
    const courseName = nextGame.course_name || 'a course';
    
    if (isToday(gameDate)) {
      return `You're playing ${courseName} today`;
    }
    
    if (isTomorrow(gameDate)) {
      return `You're playing ${courseName} tomorrow`;
    }
    
    const daysUntil = differenceInDays(gameDate, new Date());
    if (daysUntil <= 7) {
      return `You're playing ${courseName} in ${daysUntil} days`;
    }
    
    return `You're playing ${courseName} on ${format(gameDate, 'MMM d')}`;
  }, [nextGame]);

  return (
    <div className="px-1 pt-2 pb-4">
      <h1 
        className="text-[26px] font-bold leading-tight"
        style={{ color: 'var(--hub-text)' }}
      >
        {greeting}, {firstName} 👋
      </h1>
      <p 
        className="text-[15px] mt-1"
        style={{ color: 'var(--hub-text-sub)' }}
      >
        {subline}
      </p>
    </div>
  );
}
