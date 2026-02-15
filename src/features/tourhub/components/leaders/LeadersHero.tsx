/**
 * LeadersHero — Full-bleed immersive hero matching PlayersHero style.
 * Straight-edge, Ken Burns, gradient scrim, stat pill.
 */

import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
  const navigate = useNavigate();
  const { player, value } = leader;
  const photoUrl = resolvePhotoUrl(player.photo_url, player.pga_tour_id, 'hero');
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
      {/* Glass back button - matches CourseDetailPage */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute z-30 left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all"
        style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>

      <Link
        to={`/tourhub/player/${player.id}`}
        className="block active:scale-[0.995] transition-transform"
      >
        {/* Straight-edge hero (no rounded corners) — matches PlayersHero */}
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(282px, 53vh, 422px)' }}>
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
            <div className="absolute inset-0 w-full h-full bg-muted" />
          )}

          {/* Gradient for text legibility — matches PlayersHero */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
          }} />

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 space-y-1.5">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-xs font-bold uppercase tracking-widest text-amber-400"
            >
              {category.label} Leader
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-3xl font-bold text-white leading-tight"
            >
              {player.full_name}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
              className="flex items-center gap-1.5"
            >
              {flag && <span className="text-lg">{flag}</span>}
              <span className="text-sm text-white/80">{countryName}</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.4 }}
              className="text-sm font-medium text-amber-400"
            >
              {fmt(value)}{unit ? ` ${unit}` : ''}
            </motion.p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
