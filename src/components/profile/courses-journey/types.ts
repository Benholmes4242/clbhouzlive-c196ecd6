// Shared types for CoursesJourney components

export interface CoursesJourneyProps {
  className?: string;
  userId?: string;
  userDisplayName?: string;
  isOwnProfile?: boolean;
}

export interface RecentlyPlayedSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export interface HighlightReelSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export interface TopRatedSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export interface CoursesbyRegionSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

export interface RegionSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

export interface RegionNavigationProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export interface ConditionalSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

export interface AchievementRing {
  id: string;
  title: string;
  subtitle: string;
  region: string;
  color: string;
  colorLight: string;
  gradient: string;
}

export interface ProgressData {
  played: number;
  total: number;
  percentage: number;
  remaining: number;
}
