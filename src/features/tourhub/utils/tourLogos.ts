/**
 * Tour Logos Configuration
 * Maps tour slugs to their official logo assets
 */

// Tour logo paths - using public folder assets
export const TOUR_LOGOS: Record<string, string> = {
  pga: '/tour-logos/pga-tour.webp',
  euro: '/tour-logos/dp-world-tour.svg',
  lpga: '/tour-logos/lpga.svg',
  liv: '/tour-logos/liv-golf.svg',
  pgad: '/tour-logos/korn-ferry.svg',
  champ: '/tour-logos/champions-tour.svg',
};

// Default fallback for unknown tours
const DEFAULT_LOGO = '/tour-logos/golf-default.svg';

/**
 * Get the logo URL for a tour
 */
export function getTourLogo(tourSlug: string): string {
  return TOUR_LOGOS[tourSlug] || DEFAULT_LOGO;
}

/**
 * Check if a tour has an official logo
 */
export function hasTourLogo(tourSlug: string): boolean {
  return tourSlug in TOUR_LOGOS;
}
