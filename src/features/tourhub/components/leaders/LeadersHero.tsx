/**
 * LeadersHero — Full-bleed immersive hero matching PlayersHero style.
 * Straight-edge, Ken Burns, gradient scrim, stat pill.
 */

import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { openTourNav } from '../../contexts/TourNavContext';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { LeaderCategory } from './constants';

interface LeadersHeroProps {
  leader: {
    player: {
      id: string;
      full_name: string;
      country: string | null;
      country_code: string | null;
      photo_url: string | null;
      pga_tour_id: string | null;
      tour_codes?: string[] | null;
    };
    playerId: string;
    value: number;
    rank: number;
  };
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
}

export function LeadersHero({ leader, category, formatOverride, unitOverride }: LeadersHeroProps) {
  
  const { player, value } = leader;
  const photoUrl = getPlayerHeadshotUrl(player.full_name, player.tour_codes?.[0] ?? 'pga');
  const flag = countryCodeToFlag(player.country_code);
  const countryName = titleCaseCountry(player.country);
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Burger menu */}
      <button 
        className="absolute z-20 flex items-center justify-center"
        style={{ top: '56px', left: '16px', width: '44px', height: '44px' }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
        aria-label="Open tour menu"
      >
        <Menu 
          className="w-[22px] h-[22px]" 
          strokeWidth={2}
          style={{ color: '#FFFFFF', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7)) drop-shadow(0 0px 8px rgba(0,0,0,0.3))' }}
        />
      </button>

      <Link
        to={`/tourhub/player/${player.id}`}
        className="block active:scale-[0.995] transition-transform"
      >
        {/* Hero — 50dvh */}
        <div className="relative w-full overflow-hidden" style={{ height: '50dvh' }}>
          {photoUrl ? (
            <motion.img
              src={photoUrl}
              alt={player.full_name}
              className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
              loading="eager"
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 12, ease: 'linear' }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${category.accentColor}22, ${category.accentColor}44)` }}>
              <span className="text-6xl font-bold text-foreground/20 select-none">
                {player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Gradient — stronger for text legibility */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.05) 60%, transparent 80%)',
          }} />

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 space-y-1.5">
            {/* Category label — 11px, 700, amber, uppercase, wide tracking */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase' as const,
                color: '#f59e0b',
              }}
            >
              {category.label} Leader
            </motion.p>

            {/* Player name — 22px, 800, white */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}
            >
              {player.full_name}
            </motion.h2>

            {/* Country — 13px, 500 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
              className="flex items-center gap-1.5"
            >
              {flag && <span className="text-lg">{flag}</span>}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{countryName}</span>
            </motion.div>

            {/* Stats pill — amber bg, white text, 13px/600 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.4 }}
            >
              <span
                className="inline-block"
                style={{
                  background: 'rgba(245,158,11,0.85)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 20,
                  padding: '6px 14px',
                  letterSpacing: '0.3px',
                }}
              >
                {fmt(value)}{unit ? ` ${unit}` : ''}
              </span>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
