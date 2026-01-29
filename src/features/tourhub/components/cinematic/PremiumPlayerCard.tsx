/**
 * PremiumPlayerCard - Apple-grade premium player card
 * Features world ranking badges, country flags, and polished styling
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from '../PlayerAvatar';
import { staggerItemVariants } from './animations';

// Country code to flag emoji mapping
function getCountryFlag(countryCode: string | null, country: string | null): string {
  if (countryCode && countryCode.length === 2) {
    // Convert 2-letter code to flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  
  // Fallback mappings for common countries
  const countryLower = country?.toLowerCase() || '';
  const fallbackFlags: Record<string, string> = {
    'united states': '🇺🇸',
    'usa': '🇺🇸',
    'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'northern ireland': '🇬🇧',
    'ireland': '🇮🇪',
    'australia': '🇦🇺',
    'japan': '🇯🇵',
    'korea': '🇰🇷',
    'south korea': '🇰🇷',
    'spain': '🇪🇸',
    'germany': '🇩🇪',
    'france': '🇫🇷',
    'italy': '🇮🇹',
    'sweden': '🇸🇪',
    'norway': '🇳🇴',
    'canada': '🇨🇦',
    'mexico': '🇲🇽',
    'south africa': '🇿🇦',
    'china': '🇨🇳',
    'thailand': '🇹🇭',
    'philippines': '🇵🇭',
    'india': '🇮🇳',
    'argentina': '🇦🇷',
    'chile': '🇨🇱',
    'colombia': '🇨🇴',
    'belgium': '🇧🇪',
    'netherlands': '🇳🇱',
    'denmark': '🇩🇰',
    'finland': '🇫🇮',
    'austria': '🇦🇹',
    'switzerland': '🇨🇭',
    'new zealand': '🇳🇿',
    'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  };
  
  return fallbackFlags[countryLower] || '🌍';
}

// Format country name to title case
function toTitleCase(str: string | null): string {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// World rank badge styling
function getRankBadgeStyle(rank: number) {
  if (rank === 1) return {
    bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    text: 'text-white',
    shadow: 'shadow-amber-500/30',
    icon: true,
  };
  if (rank === 2) return {
    bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
    text: 'text-white',
    shadow: 'shadow-slate-400/30',
    icon: false,
  };
  if (rank === 3) return {
    bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    text: 'text-white',
    shadow: 'shadow-orange-500/20',
    icon: false,
  };
  if (rank <= 10) return {
    bg: 'bg-slate-800',
    text: 'text-white',
    shadow: 'shadow-slate-800/20',
    icon: false,
  };
  return {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    shadow: '',
    icon: false,
  };
}

interface PremiumPlayerCardProps {
  playerId: string;
  playerName: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  worldRank?: number | null;
  avgPoints?: number | null;
  eventsPlayed?: number | null;
  rankChange?: number | null;
  variant?: 'elite' | 'active' | 'default';
}

export function PremiumPlayerCard({
  playerId,
  playerName,
  country,
  countryCode,
  photoUrl,
  worldRank,
  avgPoints,
  eventsPlayed,
  rankChange,
  variant = 'default',
}: PremiumPlayerCardProps) {
  const flag = getCountryFlag(countryCode, country);
  const rankStyle = worldRank ? getRankBadgeStyle(worldRank) : null;
  
  return (
    <Link to={`/tourhub/player/${playerId}`} className="group">
      <motion.div
        variants={staggerItemVariants}
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-2xl",
          "bg-white border border-slate-200",
          "hover:bg-slate-50 hover:border-slate-300 hover:shadow-md",
          "transition-all duration-200"
        )}
        whileHover={{ x: 4, scale: 1.01 }}
        transition={{ duration: 0.15 }}
      >
        {/* World Rank Badge */}
        {worldRank && worldRank > 0 && (
          <div className={cn(
            "absolute -top-2 -left-2 min-w-[32px] h-8 px-2",
            "rounded-full flex items-center justify-center",
            "shadow-lg",
            rankStyle?.bg,
            rankStyle?.shadow
          )}>
            {rankStyle?.icon ? (
              <Trophy className="w-4 h-4 text-white" />
            ) : (
              <span className={cn("text-sm font-bold", rankStyle?.text)}>
                {worldRank}
              </span>
            )}
          </div>
        )}
        
        {/* Avatar */}
        <div className="relative">
          <PlayerAvatar
            playerId={playerId}
            playerName={playerName}
            fallbackPhotoUrl={photoUrl}
            size="lg"
            className={cn(
              "border-2",
              worldRank && worldRank <= 3 
                ? worldRank === 1 ? "border-amber-400" : worldRank === 2 ? "border-slate-400" : "border-orange-400"
                : "border-slate-200"
            )}
          />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-800 truncate group-hover:text-slate-900">
            {playerName}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base">{flag}</span>
            <span className="text-sm text-slate-500 truncate">
              {toTitleCase(country)}
            </span>
          </div>
        </div>
        
        {/* Stats based on variant */}
        <div className="flex items-center gap-3">
          {/* Rank change indicator */}
          {variant === 'elite' && rankChange !== null && rankChange !== undefined && rankChange !== 0 && (
            <div className={cn(
              "flex items-center gap-0.5 text-sm font-medium",
              rankChange > 0 ? "text-emerald-600" : "text-red-500"
            )}>
              {rankChange > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(rankChange)}</span>
            </div>
          )}
          
          {/* Primary stat */}
          <div className="text-right">
            {variant === 'elite' && avgPoints && (
              <>
                <p className="text-lg font-bold text-slate-800">{avgPoints.toFixed(2)}</p>
                <p className="text-xs text-slate-400">Avg Pts</p>
              </>
            )}
            {variant === 'active' && eventsPlayed && (
              <>
                <p className="text-lg font-bold text-slate-800">{eventsPlayed}</p>
                <p className="text-xs text-slate-400">Events</p>
              </>
            )}
            {variant === 'default' && worldRank && worldRank > 0 && (
              <>
                <p className="text-lg font-bold text-slate-800">#{worldRank}</p>
                <p className="text-xs text-slate-400">World</p>
              </>
            )}
            {variant === 'default' && (!worldRank || worldRank <= 0) && eventsPlayed && (
              <>
                <p className="text-lg font-bold text-slate-800">{eventsPlayed}</p>
                <p className="text-xs text-slate-400">Events</p>
              </>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </motion.div>
    </Link>
  );
}

// Compact version for lists
export function PremiumPlayerRow({
  playerId,
  playerName,
  country,
  countryCode,
  photoUrl,
  worldRank,
  eventsPlayed,
}: Omit<PremiumPlayerCardProps, 'variant' | 'avgPoints' | 'rankChange'>) {
  const flag = getCountryFlag(countryCode, country);
  
  return (
    <Link to={`/tourhub/player/${playerId}`} className="group">
      <motion.div
        variants={staggerItemVariants}
        className={cn(
          "flex items-center gap-4 py-4 px-4",
          "bg-white hover:bg-slate-50 transition-colors",
          "border-b border-slate-100 last:border-0"
        )}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.15 }}
      >
        {/* Avatar */}
        <PlayerAvatar
          playerId={playerId}
          playerName={playerName}
          fallbackPhotoUrl={photoUrl}
          size="lg"
          className="border-2 border-slate-200"
        />
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-800 truncate group-hover:text-slate-900">
            {playerName}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base">{flag}</span>
            <span className="text-sm text-slate-500 truncate">
              {toTitleCase(country)}
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4">
          {worldRank && worldRank > 0 && (
            <div className="text-right">
              <p className="text-lg font-bold text-slate-800">#{worldRank}</p>
              <p className="text-xs text-slate-400">World</p>
            </div>
          )}
          {eventsPlayed && eventsPlayed > 0 && (!worldRank || worldRank <= 0) && (
            <div className="text-right">
              <p className="text-lg font-bold text-slate-800">{eventsPlayed}</p>
              <p className="text-xs text-slate-400">Events</p>
            </div>
          )}
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </motion.div>
    </Link>
  );
}
