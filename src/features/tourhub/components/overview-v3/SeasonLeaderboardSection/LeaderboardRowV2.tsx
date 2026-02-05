/**
 * LeaderboardRowV2 - Individual row for ranks 4-10
 * 
 * PGA/F1 broadcast style:
 * - 72px height
 * - Rank number (28-32px column)
 * - Player avatar (44-48px, circle)
 * - Player name + country (stacked)
 * - Stat value (right-aligned)
 * - Optional trailing chevron
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderEntry } from './types';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface LeaderboardRowV2Props {
  player: LeaderEntry;
  animationDelay?: number;
}

/** Format country name with title case */
function formatCountryName(code: string | null): string {
  if (!code) return '';
  // Common country code to name mappings
  const countryNames: Record<string, string> = {
    USA: 'United States',
    GBR: 'Great Britain',
    AUS: 'Australia',
    CAN: 'Canada',
    JPN: 'Japan',
    KOR: 'South Korea',
    ESP: 'Spain',
    GER: 'Germany',
    FRA: 'France',
    ITA: 'Italy',
    IRL: 'Ireland',
    RSA: 'South Africa',
    SWE: 'Sweden',
    NOR: 'Norway',
    DEN: 'Denmark',
    MEX: 'Mexico',
    COL: 'Colombia',
    ARG: 'Argentina',
    CHI: 'Chile',
    ENG: 'England',
    SCO: 'Scotland',
    WAL: 'Wales',
    NZL: 'New Zealand',
    CHN: 'China',
    IND: 'India',
    THA: 'Thailand',
    VEN: 'Venezuela',
    PHI: 'Philippines',
    TWN: 'Taiwan',
    BEL: 'Belgium',
    NED: 'Netherlands',
    AUT: 'Austria',
    SUI: 'Switzerland',
  };
  return countryNames[code.toUpperCase()] || code;
}

export const LeaderboardRowV2 = memo(function LeaderboardRowV2({
  player,
  animationDelay = 0,
}: LeaderboardRowV2Props) {
  const navigate = useNavigate();
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);

  const handleTap = () => {
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <motion.button
      onClick={handleTap}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-3 px-4 transition-colors duration-150 active:bg-[rgba(0,0,0,0.03)]"
      style={{ 
        height: '72px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
      role="listitem"
      aria-label={`Rank ${player.rank}, ${player.playerName}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Rank number */}
      <div className="w-8 text-center flex-shrink-0">
        <span className="text-[15px] font-semibold text-[#0B1220] tabular-nums">
          {player.rank}
        </span>
      </div>

      {/* Avatar - circle cropped */}
      <div className="w-[46px] h-[46px] rounded-full overflow-hidden bg-[#F1F5F9] border border-[rgba(0,0,0,0.06)] flex-shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.initials-fallback');
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="initials-fallback w-full h-full bg-[#F1F5F9] flex items-center justify-center"
          style={{ display: photoUrl ? 'none' : 'flex' }}
        >
          <span className="text-sm font-bold text-[#94A3B8]">{player.initials}</span>
        </div>
      </div>

      {/* Player name + country (stacked) */}
      <div className="flex-1 min-w-0 text-left">
        <p 
          className="text-[17px] font-semibold text-[#0B1220] truncate leading-tight"
          title={player.playerName}
        >
          {player.playerName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-[14px] h-[10px] flex-shrink-0">
            <CountryFlag country={player.countryCode} size="sm" />
          </div>
          <span className="text-[13px] text-[rgba(11,18,32,0.65)] truncate">
            {formatCountryName(player.countryCode)}
          </span>
        </div>
      </div>

      {/* Stat value (right-aligned) */}
      <div className="flex items-baseline gap-0.5 flex-shrink-0">
        <span className="text-[20px] font-semibold text-[#0B1220] tabular-nums">
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span className="text-[14px] text-[rgba(11,18,32,0.65)]">
            {player.statUnit}
          </span>
        )}
      </div>

      {/* Trailing chevron */}
      <ChevronRight className="w-4 h-4 text-[rgba(11,18,32,0.3)] flex-shrink-0" />
    </motion.button>
  );
});
