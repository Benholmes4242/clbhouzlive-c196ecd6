/**
 * statLeaderStyles - Shared style constants for Season Stats Leader cards
 * Matches the visual language of Top10CourseCard
 */

export const STAT_LEADER_CARD = {
  width: 227,
  height: 292,
  borderRadius: 22,
  shadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
} as const;

export const FROSTED_GLASS = {
  badge: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  badgeLeader: {
    background: 'linear-gradient(135deg, rgba(251,191,36,0.9) 0%, rgba(245,158,11,0.9) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(251,191,36,0.5)',
  },
  pill: {
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  pillLeader: {
    background: 'linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(245,158,11,0.15) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(251,191,36,0.3)',
  },
} as const;

export const GRADIENT_OVERLAY = {
  textLegibility: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)',
} as const;

export const STAT_CATEGORIES = [
  { 
    id: 'driving_distance', 
    label: 'Distance', 
    fullLabel: 'Driving Distance',
    icon: '🏌️',
    unit: 'yds',
    description: 'Average driving distance off the tee',
  },
  { 
    id: 'driving_accuracy', 
    label: 'Accuracy', 
    fullLabel: 'Driving Accuracy',
    icon: '🎯',
    unit: '%',
    description: 'Percentage of fairways hit',
  },
  { 
    id: 'scrambling', 
    label: 'Scrambling', 
    fullLabel: 'Scrambling',
    icon: '🔄',
    unit: '%',
    description: 'Percentage of up-and-downs made',
  },
  { 
    id: 'putting', 
    label: 'Putting', 
    fullLabel: 'Putting Average',
    icon: '🕳️',
    unit: 'putts',
    description: 'Average putts per hole',
  },
  { 
    id: 'sg_total', 
    label: 'SG: Total', 
    fullLabel: 'Strokes Gained: Total',
    icon: '📊',
    unit: '',
    description: 'Total strokes gained vs field average',
  },
] as const;

export type StatCategoryId = typeof STAT_CATEGORIES[number]['id'];

// Fallback gradients for players without photos
export const PLAYER_FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f 0%, #0c1929 100%)',
  'linear-gradient(135deg, #2d3b4a 0%, #151c24 100%)',
  'linear-gradient(135deg, #3d4f3d 0%, #1a241a 100%)',
  'linear-gradient(135deg, #4a3d3d 0%, #241a1a 100%)',
  'linear-gradient(135deg, #3d3d4a 0%, #1a1a24 100%)',
];

export function getPlayerFallbackGradient(index: number): string {
  return PLAYER_FALLBACK_GRADIENTS[index % PLAYER_FALLBACK_GRADIENTS.length];
}
