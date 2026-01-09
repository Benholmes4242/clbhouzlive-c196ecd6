/**
 * useHubTimeOfDay - Subtle time-of-day theming hook
 * Calculates theme on mount only, no transitions during use
 */

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeOfDayTheme {
  timeOfDay: TimeOfDay;
  bg: string;
  surface: string;
  gradient: string;
}

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const themes: Record<TimeOfDay, TimeOfDayTheme> = {
  morning: {
    timeOfDay: 'morning',
    bg: '#f7f9fb',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(230, 240, 255, 0.35), rgba(255, 255, 255, 0))',
  },
  afternoon: {
    timeOfDay: 'afternoon',
    bg: '#f6f7f5',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0))',
  },
  evening: {
    timeOfDay: 'evening',
    bg: '#f5f3ef',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(255, 220, 190, 0.25), rgba(255, 255, 255, 0))',
  },
  night: {
    timeOfDay: 'night',
    bg: '#f2f3f4',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(200, 210, 220, 0.25), rgba(255, 255, 255, 0))',
  },
};

// Calculate once on import - no re-renders
const currentTheme = themes[getTimeOfDay()] || themes.afternoon;

export function useHubTimeOfDay(): TimeOfDayTheme {
  return currentTheme;
}
