/**
 * LikelyWinnersCarousel - Chapter 4: Curated contenders
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ConfidenceBar } from './components/ConfidenceBar';
import type { WinnerProfile } from './types';

interface LikelyWinnersCarouselProps {
  winners: WinnerProfile[];
}

// Map common country names/codes to 2-letter ISO codes for flag emojis
const COUNTRY_CODE_MAP: Record<string, string> = {
  'USA': 'US', 'UNITED STATES': 'US', 'UNITED STATES OF AMERICA': 'US', 'AMERICA': 'US',
  'GBR': 'GB', 'GREAT BRITAIN': 'GB', 'UNITED KINGDOM': 'GB', 'ENGLAND': 'GB', 'UK': 'GB',
  'JPN': 'JP', 'JAPAN': 'JP',
  'KOR': 'KR', 'SOUTH KOREA': 'KR', 'KOREA': 'KR',
  'AUS': 'AU', 'AUSTRALIA': 'AU',
  'CAN': 'CA', 'CANADA': 'CA',
  'RSA': 'ZA', 'SOUTH AFRICA': 'ZA',
  'ESP': 'ES', 'SPAIN': 'ES',
  'IRL': 'IE', 'IRELAND': 'IE',
  'SWE': 'SE', 'SWEDEN': 'SE',
  'NOR': 'NO', 'NORWAY': 'NO',
  'DEN': 'DK', 'DENMARK': 'DK',
  'GER': 'DE', 'GERMANY': 'DE',
  'FRA': 'FR', 'FRANCE': 'FR',
  'ITA': 'IT', 'ITALY': 'IT',
  'ARG': 'AR', 'ARGENTINA': 'AR',
  'COL': 'CO', 'COLOMBIA': 'CO',
  'MEX': 'MX', 'MEXICO': 'MX',
  'CHI': 'CL', 'CHILE': 'CL',
  'NZL': 'NZ', 'NEW ZEALAND': 'NZ',
  'CHN': 'CN', 'CHINA': 'CN',
  'IND': 'IN', 'INDIA': 'IN',
  'THA': 'TH', 'THAILAND': 'TH',
  'PHI': 'PH', 'PHILIPPINES': 'PH',
  'TWN': 'TW', 'TAIWAN': 'TW', 'CHINESE TAIPEI': 'TW',
  'AUT': 'AT', 'AUSTRIA': 'AT',
  'BEL': 'BE', 'BELGIUM': 'BE',
  'NED': 'NL', 'NETHERLANDS': 'NL', 'HOLLAND': 'NL',
  'POR': 'PT', 'PORTUGAL': 'PT',
  'FIN': 'FI', 'FINLAND': 'FI',
  'VEN': 'VE', 'VENEZUELA': 'VE',
  'PAR': 'PY', 'PARAGUAY': 'PY',
  'PUR': 'PR', 'PUERTO RICO': 'PR',
  'ZIM': 'ZW', 'ZIMBABWE': 'ZW',
  'FIJ': 'FJ', 'FIJI': 'FJ',
  'WAL': 'GB', 'WALES': 'GB',
  'SCO': 'GB', 'SCOTLAND': 'GB',
  'NIR': 'GB', 'NORTHERN IRELAND': 'GB',
};

const getCountryFlag = (code?: string): string => {
  if (!code) return '';
  
  const normalized = code.toUpperCase().trim();
  
  // Already a 2-letter code? Use directly
  if (normalized.length === 2 && /^[A-Z]{2}$/.test(normalized)) {
    const codePoints = normalized.split('').map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  
  // Look up the 2-letter code from our map
  const twoLetterCode = COUNTRY_CODE_MAP[normalized];
  if (twoLetterCode) {
    const codePoints = twoLetterCode.split('').map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  
  // Unknown - return empty rather than gibberish
  return '';
};

export const LikelyWinnersCarousel = memo(function LikelyWinnersCarousel({
  winners,
}: LikelyWinnersCarouselProps) {
  const navigate = useNavigate();

  if (winners.length === 0) return null;

  const [featured, ...others] = winners;

  const handlePlayerClick = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <h3 className="text-base font-semibold text-slate-900 mb-3">Likely Winners</h3>

      {/* Featured Card (#1) - Stacked Layout */}
      <motion.button
        onClick={() => handlePlayerClick(featured.id)}
        className="w-full bg-white rounded-2xl border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-4 text-left"
        whileTap={{ scale: 0.98 }}
      >
        {/* Top Row: Avatar + Name/Meta */}
        <div className="flex gap-4 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={featured.avatarUrl}
              alt={featured.name}
              className="w-20 h-20 rounded-xl object-cover bg-slate-100"
              loading="lazy"
            />
            {/* Rank Badge */}
            <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">1</span>
            </div>
          </div>

          {/* Name + Confidence + Tag */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-900">{featured.name}</h4>
              {featured.countryCode && (
                <span className="text-sm">{getCountryFlag(featured.countryCode)}</span>
              )}
            </div>

            {/* Confidence Bar */}
            <div className="flex items-center gap-2 mb-2">
              <ConfidenceBar tier={featured.confidenceTier} />
              <span className="text-sm font-medium text-slate-500 capitalize">
                {featured.confidenceTier}
              </span>
            </div>

            {/* Key Tag */}
            {featured.keyTag && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                {featured.keyTag}
              </span>
            )}
          </div>
        </div>

        {/* Bullet Points - Full Width Below */}
        <ul className="space-y-2.5">
          {featured.fitBullets.slice(0, 3).map((bullet, i) => (
            <li key={i} className="text-sm text-slate-600 leading-relaxed">
              • {bullet}
            </li>
          ))}
        </ul>
      </motion.button>

      {/* Others Carousel */}
      <div
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {others.map((winner, index) => (
          <motion.button
            key={winner.id}
            onClick={() => handlePlayerClick(winner.id)}
            className="flex-shrink-0 w-[155px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left"
            style={{ scrollSnapAlign: 'start' }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Avatar + Rank */}
            <div className="relative">
              <img
                src={winner.avatarUrl}
                alt={winner.name}
                className="w-full h-28 object-cover object-top bg-slate-100"
                loading="lazy"
              />
              {/* Darker rank badge */}
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shadow-md">
                <span className="text-xs font-bold text-white">{index + 2}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-2.5">
              {/* Name + Flag */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <h4 className="text-sm font-semibold text-slate-900 truncate">{winner.name}</h4>
                {winner.countryCode && (
                  <span className="text-xs flex-shrink-0">{getCountryFlag(winner.countryCode)}</span>
                )}
              </div>

              {/* Confidence */}
              <ConfidenceBar tier={winner.confidenceTier} size="small" />

              {/* Key Tag */}
              {winner.keyTag && (
                <p className="text-xs text-slate-500 mt-1.5 truncate">{winner.keyTag}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
});
