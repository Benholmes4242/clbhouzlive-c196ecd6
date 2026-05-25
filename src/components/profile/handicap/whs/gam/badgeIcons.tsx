import React from 'react';
import {
  Activity, ArrowUp, Bird, CircleDot, Crosshair, Crown, Feather, Flag, Flame, Flower, Gauge, Globe,
  ListChecks, Map, MapPin, Medal, Minus, Scissors, Shield, Sparkles, Star, Swords, Target,
  TrendingDown, Trophy, Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Canonical mapping of `gam_badge_catalogue.icon_name` (kebab-case) → Lucide icon component.
 * Keep in sync with `SELECT DISTINCT icon_name FROM gam_badge_catalogue`.
 */
export const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  'arrow-up': ArrowUp,
  bird: Bird,
  'circle-dot': CircleDot,
  crosshair: Crosshair,
  crown: Crown,
  feather: Feather,
  flag: Flag,
  flame: Flame,
  flower: Flower,
  gauge: Gauge,
  globe: Globe,
  'list-checks': ListChecks,
  map: Map,
  'map-pin': MapPin,
  medal: Medal,
  minus: Minus,
  scissors: Scissors,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  swords: Swords,
  target: Target,
  'trending-down': TrendingDown,
  trophy: Trophy,
  zap: Zap,
};

export function renderBadgeIcon(name: string | null | undefined, size = 22, color = 'currentColor'): React.ReactNode {
  if (!name) return <Trophy size={size} color={color} />;
  const Icon = BADGE_ICON_MAP[name.toLowerCase()];
  if (Icon) return <Icon size={size} color={color} />;
  // Fallback: a neutral trophy rather than raw text.
  return <Trophy size={size} color={color} />;
}
