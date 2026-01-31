/**
 * StatLeaderCard - Cinematic player card for Season Stats Leaders
 * Matches the visual language of Top10CourseCard
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  STAT_LEADER_CARD, 
  FROSTED_GLASS, 
  GRADIENT_OVERLAY,
  getPlayerFallbackGradient,
} from './statLeaderStyles';

interface StatLeaderCardProps {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    country?: string | null;
  };
  rank: number;
  statValue: string;
  statUnit: string;
  index: number;
  onTap: () => void;
  className?: string;
}

export function StatLeaderCard({ 
  player, 
  rank, 
  statValue,
  statUnit,
  index,
  onTap,
  className,
}: StatLeaderCardProps) {
  const isLeader = rank === 1;
  const hasPhoto = !!player.photoUrl;
  
  // Country flag emoji helper (simple mapping for common countries)
  const getCountryFlag = (country: string | null | undefined): string => {
    if (!country) return '';
    const countryFlags: Record<string, string> = {
      'USA': '🇺🇸', 'United States': '🇺🇸',
      'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'NIR': '🇬🇧', 'Northern Ireland': '🇬🇧',
      'AUS': '🇦🇺', 'Australia': '🇦🇺',
      'RSA': '🇿🇦', 'South Africa': '🇿🇦',
      'JPN': '🇯🇵', 'Japan': '🇯🇵',
      'KOR': '🇰🇷', 'South Korea': '🇰🇷', 'Korea': '🇰🇷',
      'ESP': '🇪🇸', 'Spain': '🇪🇸',
      'IRL': '🇮🇪', 'Ireland': '🇮🇪',
      'CAN': '🇨🇦', 'Canada': '🇨🇦',
      'SWE': '🇸🇪', 'Sweden': '🇸🇪',
      'GER': '🇩🇪', 'Germany': '🇩🇪',
      'FRA': '🇫🇷', 'France': '🇫🇷',
      'MEX': '🇲🇽', 'Mexico': '🇲🇽',
      'ARG': '🇦🇷', 'Argentina': '🇦🇷',
      'CHI': '🇨🇱', 'Chile': '🇨🇱',
      'NOR': '🇳🇴', 'Norway': '🇳🇴',
      'DEN': '🇩🇰', 'Denmark': '🇩🇰',
      'ITA': '🇮🇹', 'Italy': '🇮🇹',
      'BEL': '🇧🇪', 'Belgium': '🇧🇪',
      'AUT': '🇦🇹', 'Austria': '🇦🇹',
      'CHN': '🇨🇳', 'China': '🇨🇳',
      'IND': '🇮🇳', 'India': '🇮🇳',
      'THA': '🇹🇭', 'Thailand': '🇹🇭',
      'COL': '🇨🇴', 'Colombia': '🇨🇴',
      'PUR': '🇵🇷', 'Puerto Rico': '🇵🇷',
      'VEN': '🇻🇪', 'Venezuela': '🇻🇪',
      'ZIM': '🇿🇼', 'Zimbabwe': '🇿🇼',
      'FIJ': '🇫🇯', 'Fiji': '🇫🇯',
      'NZL': '🇳🇿', 'New Zealand': '🇳🇿',
      'PHI': '🇵🇭', 'Philippines': '🇵🇭',
      'TPE': '🇹🇼', 'Chinese Taipei': '🇹🇼', 'Taiwan': '🇹🇼',
    };
    return countryFlags[country] || '🏳️';
  };
  
  return (
    <motion.div
      className={cn(
        "relative flex-shrink-0 snap-start cursor-pointer overflow-hidden",
        className
      )}
      style={{
        width: STAT_LEADER_CARD.width,
        height: STAT_LEADER_CARD.height,
        borderRadius: STAT_LEADER_CARD.borderRadius,
        boxShadow: STAT_LEADER_CARD.shadow,
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onTap}
    >
      {/* Background Image or Gradient Fallback */}
      {hasPhoto ? (
        <img
          src={player.photoUrl!}
          alt={`${player.firstName} ${player.lastName}`}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div 
          className="absolute inset-0"
          style={{ background: getPlayerFallbackGradient(index) }}
        >
          {/* Initials fallback for no photo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-white/30">
              {player.firstName?.[0]}{player.lastName?.[0]}
            </span>
          </div>
        </div>
      )}

      {/* Gradient Overlay for Text Legibility */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: GRADIENT_OVERLAY.textLegibility }}
      />

      {/* Rank Badge - Top Left (Frosted Glass) */}
      <div 
        className="absolute top-4 left-4 flex items-center justify-center rounded-full px-3 py-1.5"
        style={isLeader ? FROSTED_GLASS.badgeLeader : FROSTED_GLASS.badge}
      >
        <span className={cn(
          "text-sm font-bold",
          isLeader ? "text-amber-900" : "text-white"
        )}>
          #{rank}
        </span>
        {isLeader && (
          <span className="ml-1">🏆</span>
        )}
      </div>

      {/* Content - Bottom */}
      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-3">
        {/* Player Name & Country */}
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight drop-shadow-md">
            {player.firstName} {player.lastName}
          </h3>
          {player.country && (
            <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
              <span>{getCountryFlag(player.country)}</span>
              <span>{player.country}</span>
            </p>
          )}
        </div>

        {/* Stat Value Pill (Frosted Glass) */}
        <div 
          className="inline-flex items-center gap-2 self-start rounded-full px-3 py-2"
          style={isLeader ? FROSTED_GLASS.pillLeader : FROSTED_GLASS.pill}
        >
          <span className={cn(
            "text-base font-bold",
            isLeader ? "text-amber-400" : "text-white"
          )}>
            {statValue}
          </span>
          {statUnit && (
            <span className="text-white/60 text-xs font-medium uppercase tracking-wide">
              {statUnit}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
