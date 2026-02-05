/**
 * LikelyWinnersCarousel - Featured #1 + side-by-side #2/#3
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { WinnerProfile, ContenderCard } from './types';
import ConfidenceProgress from './components/ConfidenceProgress';

interface LikelyWinnersCarouselProps {
  featured: WinnerProfile;
  cards: ContenderCard[];
}

// Generate initials fallback from player name
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Rank badge colors
const rankBadgeColor = (rank: number): string => {
  if (rank === 1) return 'bg-gradient-to-br from-amber-600 to-amber-700';
  if (rank === 2) return 'bg-slate-400';
  return 'bg-amber-700/70';
};

// Avatar background colors for initials fallback
const avatarColors = ['bg-green-800', 'bg-blue-800', 'bg-purple-800', 'bg-teal-800', 'bg-rose-800'];

export const LikelyWinnersCarousel = memo(function LikelyWinnersCarousel({
  featured,
  cards,
}: LikelyWinnersCarouselProps) {
  const navigate = useNavigate();

  // Take only #2 and #3 from the contender cards
  const runnersUp = cards.filter(c => c.rank && c.rank <= 3).slice(0, 2);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-semibold text-slate-900">Likely Winners</h3>
        <span className="text-[11px] font-medium text-slate-400">AI confidence score</span>
      </div>

      {/* ── #1 PICK — HERO CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[14px] border border-amber-200 p-[18px] mb-2.5"
        style={{
          background: 'linear-gradient(135deg, #F5ECD7 0%, #FFFEF7 100%)',
          boxShadow: '0 4px 16px rgba(184,134,11,0.08)',
        }}
      >
        {/* Gold top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #B8860B 50%, transparent 100%)' }}
        />

        <div className="flex items-start gap-3.5">
          {/* Avatar with rank badge */}
          <div className="relative flex-shrink-0">
            {featured.avatarUrl ? (
              <img
                src={featured.avatarUrl}
                alt={featured.name}
                className="w-14 h-14 rounded-2xl object-cover"
                loading="eager"
              />
            ) : (
              <div className={`w-14 h-14 rounded-2xl ${avatarColors[0]} flex items-center justify-center text-lg font-extrabold text-white tracking-tight`}>
                {getInitials(featured.name)}
              </div>
            )}
            <div className="absolute -top-1.5 -left-1.5 w-[22px] h-[22px] rounded-[7px] bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-[11px] font-extrabold text-white shadow-md">
              1
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + country */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[17px] font-bold text-slate-900 tracking-tight">{featured.name}</span>
              {featured.countryCode && (
                <span className="text-[10px] font-semibold text-slate-400 bg-black/[0.04] px-1.5 py-0.5 rounded">
                  {featured.countryCode}
                </span>
              )}
            </div>

            {/* Key achievement badge */}
            {featured.keyTag && (
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-700/[0.08] px-2.5 py-[3px] rounded-md mb-3.5">
                🏆 {featured.keyTag}
              </div>
            )}

            {/* Confidence bar */}
            <div className="mb-3.5">
              <ConfidenceProgress tier={featured.confidenceTier} variant="gold" />
            </div>

            {/* Reason bullets */}
            {featured.fitBullets.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {featured.fitBullets.slice(0, 3).map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-amber-700 text-[8px] mt-[5px] flex-shrink-0">◆</span>
                    <span className="text-[12.5px] leading-relaxed text-slate-500">{bullet}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── RUNNERS UP — #2 and #3 SIDE BY SIDE ── */}
      <div className="flex gap-2.5">
        {runnersUp.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
            viewport={{ once: true }}
            className="flex-1 bg-white rounded-[14px] border border-slate-200 p-3.5 shadow-sm"
          >
            {/* Avatar with rank badge */}
            <div className="relative mb-3 inline-block">
              {card.avatarUrl ? (
                <img
                  src={card.avatarUrl}
                  alt={card.name}
                  className="w-10 h-10 rounded-xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className={`w-10 h-10 rounded-xl ${avatarColors[i + 1] || avatarColors[1]} flex items-center justify-center text-sm font-extrabold text-white`}>
                  {getInitials(card.name)}
                </div>
              )}
              <div className={`absolute -top-1 -left-1 w-[18px] h-[18px] rounded-md ${rankBadgeColor(card.rank || i + 2)} flex items-center justify-center text-[10px] font-extrabold text-white`}>
                {card.rank || i + 2}
              </div>
            </div>

            {/* Name */}
            <div className="text-[13.5px] font-bold text-slate-900 tracking-tight mb-0.5">
              {card.name}
            </div>

            {/* Country */}
            {card.countryCode && (
              <div className="text-[10px] font-medium text-slate-400 mb-2.5">
                {card.countryCode}
              </div>
            )}

            {/* Confidence bar */}
            <div className="mb-2.5">
              <ConfidenceProgress tier={card.confidenceTier || 'medium'} variant="neutral" />
            </div>

            {/* Description */}
            <p className="text-[11.5px] leading-relaxed text-slate-400 m-0">
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
