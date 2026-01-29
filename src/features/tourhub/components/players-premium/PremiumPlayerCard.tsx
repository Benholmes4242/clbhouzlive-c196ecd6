/**
 * PremiumPlayerCard - Cinematic player card for Players tab
 * Glass morphism design with rank badges and college display
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import { PlayerAvatar } from '../PlayerAvatar';
import { GlassCard, RankBadge } from '../premium';

interface PremiumPlayerCardProps {
  player: TourPlayer;
  stats?: TourPlayerStatistics & { worldRank?: number | null };
  college?: CollegeMedia | null;
  statDisplay?: 'rank' | 'events' | 'wins';
  index?: number;
  className?: string;
}

// Country code to flag emoji mapping
function getCountryFlag(country: string | null): string {
  if (!country) return '';
  const countryToFlag: Record<string, string> = {
    'UNITED STATES': '🇺🇸', 'USA': '🇺🇸', 'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'SCOTLAND': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'IRELAND': '🇮🇪', 'NORTHERN IRELAND': '🇬🇧', 'WALES': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'AUSTRALIA': '🇦🇺', 'CANADA': '🇨🇦', 'JAPAN': '🇯🇵', 'KOREA': '🇰🇷', 'SOUTH KOREA': '🇰🇷',
    'SPAIN': '🇪🇸', 'GERMANY': '🇩🇪', 'FRANCE': '🇫🇷', 'ITALY': '🇮🇹', 'SWEDEN': '🇸🇪',
    'SOUTH AFRICA': '🇿🇦', 'MEXICO': '🇲🇽', 'ARGENTINA': '🇦🇷', 'COLOMBIA': '🇨🇴',
    'CHILE': '🇨🇱', 'BRAZIL': '🇧🇷', 'INDIA': '🇮🇳', 'CHINA': '🇨🇳', 'THAILAND': '🇹🇭',
    'PHILIPPINES': '🇵🇭', 'TAIWAN': '🇹🇼', 'NEW ZEALAND': '🇳🇿', 'FINLAND': '🇫🇮',
    'DENMARK': '🇩🇰', 'BELGIUM': '🇧🇪', 'NETHERLANDS': '🇳🇱', 'AUSTRIA': '🇦🇹',
    'SWITZERLAND': '🇨🇭', 'PORTUGAL': '🇵🇹', 'NORWAY': '🇳🇴',
  };
  const upper = country.toUpperCase();
  return countryToFlag[upper] || '🏳️';
}

function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function PremiumPlayerCard({ 
  player, 
  stats, 
  college, 
  statDisplay = 'rank',
  index = 0,
  className 
}: PremiumPlayerCardProps) {
  const worldRank = stats?.worldRank ?? stats?.world_rank;
  const hasValidRank = typeof worldRank === 'number' && worldRank >= 1;
  const formattedCountry = player.country ? toTitleCase(player.country) : null;
  const collegeShortName = college?.short_name || college?.college_name || player.college;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
    >
      <Link to={`/tourhub/player/${player.id}`}>
        <GlassCard 
          className={cn(
            'p-4 flex items-center gap-4 group hover:bg-white/15 transition-all cursor-pointer',
            hasValidRank && worldRank <= 3 && 'ring-1 ring-yellow-500/20',
            className
          )}
        >
          {/* Avatar with Rank Badge */}
          <div className="relative shrink-0">
            <PlayerAvatar
              playerId={player.id}
              playerName={player.full_name}
              fallbackPhotoUrl={player.photo_url}
              size="lg"
              className="ring-2 ring-white/10"
            />
            {hasValidRank && (
              <div className="absolute -bottom-1 -right-1">
                <RankBadge rank={worldRank} size="sm" />
              </div>
            )}
          </div>
          
          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getCountryFlag(player.country)}</span>
              <h3 className="font-semibold text-white truncate group-hover:text-th-accent transition-colors">
                {player.full_name}
              </h3>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-white/60">
              {formattedCountry && <span>{formattedCountry}</span>}
              {player.turned_pro && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Pro {player.turned_pro}
                </span>
              )}
            </div>
            
            {/* Stats Row */}
            {stats && (
              <div className="flex items-center gap-4 mt-2">
                {stats.wins && stats.wins > 0 && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                    <Trophy className="w-3 h-3" />
                    {stats.wins} win{stats.wins > 1 ? 's' : ''}
                  </span>
                )}
                {stats.events_played && (
                  <span className="flex items-center gap-1 text-xs text-white/50">
                    <Target className="w-3 h-3" />
                    {stats.events_played} events
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* College Feature */}
          <div className="flex flex-col items-center shrink-0 min-w-[60px]">
            {college?.logo_url ? (
              <>
                <div className="w-12 h-12 rounded-lg bg-white/10 p-1 flex items-center justify-center">
                  <img 
                    src={college.logo_url} 
                    alt={college.college_name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] text-white/50 mt-1 text-center max-w-[70px] truncate">
                  {collegeShortName}
                </span>
              </>
            ) : player.college ? (
              <span className="text-xs text-white/50 text-center max-w-[70px] line-clamp-2">
                {player.college}
              </span>
            ) : null}
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
