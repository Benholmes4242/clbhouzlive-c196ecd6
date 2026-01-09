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
  // Dock theming
  dockBg: string;
  dockBorder: string;
  dockShadow: string;
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
    // Dock: matches page bg with glass effect
    dockBg: 'rgba(247, 249, 251, 0.85)',
    dockBorder: 'rgba(120, 140, 170, 0.12)',
    dockShadow: '0 -8px 24px rgba(0,0,0,0.06)',
  },
  afternoon: {
    timeOfDay: 'afternoon',
    bg: '#f6f7f5',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0))',
    // Dock: matches page bg with glass effect
    dockBg: 'rgba(246, 247, 245, 0.88)',
    dockBorder: 'rgba(0, 0, 0, 0.06)',
    dockShadow: '0 -8px 24px rgba(0,0,0,0.06)',
  },
  evening: {
    timeOfDay: 'evening',
    bg: '#f5f3ef',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(255, 220, 190, 0.25), rgba(255, 255, 255, 0))',
    // Dock: matches warm cream page bg with glass effect
    dockBg: 'rgba(245, 243, 239, 0.88)',
    dockBorder: 'rgba(140, 120, 100, 0.10)',
    dockShadow: '0 -8px 24px rgba(0,0,0,0.06)',
  },
  night: {
    timeOfDay: 'night',
    bg: '#f2f3f4',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(200, 210, 220, 0.25), rgba(255, 255, 255, 0))',
    // Dock: matches cool page bg with glass effect
    dockBg: 'rgba(242, 243, 244, 0.88)',
    dockBorder: 'rgba(90, 110, 130, 0.10)',
    dockShadow: '0 -8px 24px rgba(0,0,0,0.08)',
  },
};

// Calculate once on import - no re-renders
const currentTheme = themes[getTimeOfDay()] || themes.afternoon;

export function useHubTimeOfDay(): TimeOfDayTheme {
  return currentTheme;
}
