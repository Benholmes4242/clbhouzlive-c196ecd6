/**
 * LeadersHero — Full-bleed immersive hero for the #1 ranked player.
 * Ken Burns animation, gradient scrim, category badge + stat glass pill.
 * Crossfades via AnimatePresence in parent.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
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
  const photoUrl = resolvePhotoUrl(player.photo_url, player.pga_tour_id, 'hero');
  const flag = countryCodeToFlag(player.country_code);
  const countryName = titleCaseCountry(player.country);
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;
  const initials = player.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        className="block relative w-full overflow-hidden active:scale-[0.99] transition-transform"
        style={{ minHeight: '340px' }}
      >
        {/* Player photo with Ken Burns */}
        {photoUrl ? (
          <motion.img
            src={photoUrl}
            alt={player.full_name}
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="eager"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 12, ease: 'linear' }}
          />
        ) : (
          /* Gradient fallback with initials */
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${category.accentColor}40, ${category.accentColor}20)`,
            }}
          >
            <span className="text-7xl font-extrabold text-white/30">{initials}</span>
          </div>
        )}

        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 85%, rgba(0,0,0,0.95) 100%)',
          }}
        />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: category.accentColor }}
          >
            {category.emoji} {category.label} Leader
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            {player.full_name}
          </h2>
          <p className="text-white/70 text-sm">
            {flag} {countryName}
          </p>
          <div
            className="mt-2 inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span className="font-mono text-2xl font-bold text-white">
              {fmt(value)}
            </span>
            {unit && (
              <span className="text-xs text-white/60">{unit}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
