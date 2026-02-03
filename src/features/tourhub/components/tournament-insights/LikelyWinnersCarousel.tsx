/**
 * LikelyWinnersCarousel - Unified carousel with Contenders + Threats
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { ConfidenceBar } from './components/ConfidenceBar';
import type { WinnerProfile, ContenderCard } from './types';

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
  
  if (normalized.length === 2 && /^[A-Z]{2}$/.test(normalized)) {
    const codePoints = normalized.split('').map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  
  const twoLetterCode = COUNTRY_CODE_MAP[normalized];
  if (twoLetterCode) {
    const codePoints = twoLetterCode.split('').map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  
  return '';
};

interface LikelyWinnersCarouselProps {
  featured: WinnerProfile;
  cards: ContenderCard[];
}

export const LikelyWinnersCarousel = memo(function LikelyWinnersCarousel({
  featured,
  cards,
}: LikelyWinnersCarouselProps) {
  const navigate = useNavigate();

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

            {/* Confidence Bar - No Text Label */}
            <div className="mb-2">
              <ConfidenceBar tier={featured.confidenceTier} />
            </div>

            {/* Key Tag */}
            {featured.keyTag && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                {featured.keyTag}
              </span>
            )}
          </div>
        </div>

        {/* Bullet Points - Full Width Below with Hanging Indent */}
        <ul className="space-y-2.5">
          {featured.fitBullets.slice(0, 3).map((bullet, i) => (
            <li key={i} className="text-sm text-slate-600 leading-relaxed flex">
              <span className="mr-2 flex-shrink-0">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </motion.button>

      {/* Combined Carousel: Contenders + Threats */}
      <div
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handlePlayerClick(card.id)}
            className="flex-shrink-0 w-[165px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left"
            style={{ scrollSnapAlign: 'start' }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Avatar + Badge */}
            <div className="relative">
              <img
                src={card.avatarUrl}
                alt={card.name}
                className="w-full h-28 object-cover object-top bg-slate-100"
                loading="lazy"
              />
              
              {/* Badge - Different for Contender vs Threat */}
              {card.type === 'contender' ? (
                // Rank Badge (2, 3, 4, 5)
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shadow-md">
                  <span className="text-xs font-bold text-white">{card.rank}</span>
                </div>
              ) : (
                // Threat Badge
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-500 flex items-center gap-1 shadow-md">
                  <TrendingUp className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold text-white uppercase">Threat</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-2.5">
              {/* Name + Flag */}
              <div className="flex items-center gap-1.5 mb-1">
                <h4 className="text-sm font-semibold text-slate-900 truncate">{card.name}</h4>
                {card.countryCode && (
                  <span className="text-xs flex-shrink-0">{getCountryFlag(card.countryCode)}</span>
                )}
              </div>

              {/* Trait Label (Threats only) */}
              {card.type === 'threat' && card.traitLabel && (
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1">
                  {card.traitLabel}
                </p>
              )}

              {/* Confidence Bar (Contenders only) */}
              {card.type === 'contender' && card.confidenceTier && (
                <div className="mb-1">
                  <ConfidenceBar tier={card.confidenceTier} size="small" />
                </div>
              )}

              {/* Description */}
              <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                {card.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
});
