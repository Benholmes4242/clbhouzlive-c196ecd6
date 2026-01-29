/**
 * PlayerProfileHero - Cinematic hero section for player profile
 * Full-bleed design with Ken Burns effect and glass overlays
 */

import { motion } from 'framer-motion';
import { Globe, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, RankBadge } from '../premium';
import { PlayerAvatar } from '../PlayerAvatar';

// Country code to flag emoji mapping
function getCountryFlag(countryCode: string): string {
  const countryToFlag: Record<string, string> = {
    'USA': '🇺🇸', 'US': '🇺🇸', 'GBR': '🇬🇧', 'GB': '🇬🇧', 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'NIR': '🇬🇧', 'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'IRL': '🇮🇪',
    'AUS': '🇦🇺', 'CAN': '🇨🇦', 'JPN': '🇯🇵', 'KOR': '🇰🇷', 'ESP': '🇪🇸',
    'GER': '🇩🇪', 'FRA': '🇫🇷', 'ITA': '🇮🇹', 'SWE': '🇸🇪', 'NOR': '🇳🇴',
    'RSA': '🇿🇦', 'ZAF': '🇿🇦', 'MEX': '🇲🇽', 'ARG': '🇦🇷', 'COL': '🇨🇴',
    'CHI': '🇨🇱', 'CHL': '🇨🇱', 'BRA': '🇧🇷', 'IND': '🇮🇳', 'CHN': '🇨🇳',
    'THA': '🇹🇭', 'PHI': '🇵🇭', 'PHL': '🇵🇭', 'TPE': '🇹🇼', 'NZL': '🇳🇿',
    'FIN': '🇫🇮', 'DEN': '🇩🇰', 'DNK': '🇩🇰', 'BEL': '🇧🇪', 'NED': '🇳🇱',
    'NLD': '🇳🇱', 'AUT': '🇦🇹', 'SUI': '🇨🇭', 'CHE': '🇨🇭', 'POR': '🇵🇹',
  };
  const code = countryCode.toUpperCase();
  return countryToFlag[code] || '🏳️';
}
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';

interface PlayerProfileHeroProps {
  player: TourPlayer;
  stats?: TourPlayerStatistics | null;
  className?: string;
}

export function PlayerProfileHero({ player, stats, className }: PlayerProfileHeroProps) {
  const worldRank = stats?.world_rank;
  const fedexRank = stats?.fedex_rank;
  const earnings = stats?.earnings;
  
  return (
    <section className={cn('relative h-[50vh] min-h-[400px] -mx-4 sm:-mx-6 lg:-mx-8', className)}>
      {/* Background with Ken Burns effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-th-glass-bg via-surface-card to-th-bg-canvas"
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
      />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-th-bg-canvas via-th-bg-canvas/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-th-bg-canvas/60 via-transparent to-th-bg-canvas/60" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Large Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <PlayerAvatar
                  playerId={player.id}
                  playerName={player.full_name || 'Player'}
                  fallbackPhotoUrl={player.photo_url}
                  size="xl"
                  className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-white/20 shadow-2xl"
                />
                {/* World Rank Badge */}
                {worldRank && worldRank > 0 && (
                  <div className="absolute -bottom-2 -right-2">
                    <RankBadge rank={worldRank} size="lg" />
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Player Info */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {/* Country flag and name */}
                <div className="flex items-center gap-3 mb-2">
                  {player.country_code && (
                    <span className="text-2xl">{getCountryFlag(player.country_code)}</span>
                  )}
                  <span className="text-sm text-white/70 uppercase tracking-wider">
                    {player.country || 'Unknown'}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                  {player.full_name}
                </h1>
                
                {/* Quick stats row */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {worldRank && worldRank > 0 && (
                    <GlassCard className="px-4 py-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-th-accent" />
                      <span className="text-sm text-white/70">World Rank</span>
                      <span className="text-lg font-bold text-white">#{worldRank}</span>
                    </GlassCard>
                  )}
                  
                  {fedexRank && fedexRank > 0 && (
                    <GlassCard className="px-4 py-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white/70">FedEx</span>
                      <span className="text-lg font-bold text-white">#{fedexRank}</span>
                    </GlassCard>
                  )}
                  
                  {earnings && earnings > 0 && (
                    <GlassCard className="px-4 py-2 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white/70">Earnings</span>
                      <span className="text-lg font-bold text-white">
                        ${(earnings / 1_000_000).toFixed(2)}M
                      </span>
                    </GlassCard>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
