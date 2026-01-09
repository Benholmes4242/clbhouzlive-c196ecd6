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
    // Dock: cool morning glass
    dockBg: 'rgba(230, 240, 255, 0.65)',
    dockBorder: 'rgba(120, 140, 170, 0.18)',
    dockShadow: '0 -8px 24px rgba(0,0,0,0.10)',
  },
  afternoon: {
    timeOfDay: 'afternoon',
    bg: '#f6f7f5',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0))',
    // Dock: neutral white glass
    dockBg: 'rgba(255, 255, 255, 0.72)',
    dockBorder: 'rgba(0, 0, 0, 0.08)',
    dockShadow: '0 -8px 24px rgba(0,0,0,0.10)',
  },
  evening: {
    timeOfDay: 'evening',
    bg: '#f5f3ef',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(255, 220, 190, 0.25), rgba(255, 255, 255, 0))',
    // Dock: warm evening glass
    dockBg: 'rgba(255, 230, 210, 0.55)',
    dockBorder: 'rgba(140, 110, 90, 0.16)',
    dockShadow: '0 -8px 24px rgba(0,0,0,0.12)',
  },
  night: {
    timeOfDay: 'night',
    bg: '#f2f3f4',
    surface: '#ffffff',
    gradient: 'linear-gradient(180deg, rgba(200, 210, 220, 0.25), rgba(255, 255, 255, 0))',
    // Dock: cool night glass
    dockBg: 'rgba(210, 220, 230, 0.55)',
    dockBorder: 'rgba(90, 110, 130, 0.16)',
    dockShadow: '0 -8px 24px rgba(0,0,0,0.14)',
  },
};

// Calculate once on import - no re-renders
const currentTheme = themes[getTimeOfDay()] || themes.afternoon;

export function useHubTimeOfDay(): TimeOfDayTheme {
  return currentTheme;
}
