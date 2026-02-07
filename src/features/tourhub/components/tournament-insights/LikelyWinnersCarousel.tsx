/**
 * LikelyWinnersCarousel - Premium light theme treatment
 * Warm cream #1 hero card, white runner-ups, dark horse reframe with lightning bolt
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Info } from 'lucide-react';
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

// Avatar background colors for initials fallback
const avatarColors = ['bg-green-800', 'bg-blue-800', 'bg-purple-800', 'bg-teal-800', 'bg-rose-800'];

// Rank badge gradient based on position
const getRankBadgeStyle = (rank: number): React.CSSProperties => {
  if (rank === 1) {
    return { background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)' };
  }
  if (rank === 2) {
    return { background: 'linear-gradient(135deg, #C0C0C0 0%, #9A9A9A 100%)' };
  }
  if (rank === 3) {
    return { background: 'linear-gradient(135deg, #CD7F32 0%, #A0622E 100%)' };
  }
  // #4-5 neutral
  return { background: 'rgba(0, 0, 0, 0.08)', color: 'rgba(0, 0, 0, 0.5)' };
};

export const LikelyWinnersCarousel = memo(function LikelyWinnersCarousel({
  featured,
  cards,
}: LikelyWinnersCarouselProps) {
  const navigate = useNavigate();
  const [showConfidenceInfo, setShowConfidenceInfo] = useState(false);

  // Split cards into contenders (#2, #3) and dark horses
  const contenderCards = cards.filter(c => c.type === 'contender');
  const threatCards = cards.filter(c => c.type === 'threat');

  return (
    <div>
      {/* Section header */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="mb-3.5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            Likely Winners
          </h3>
          <button 
            onClick={() => setShowConfidenceInfo(!showConfidenceInfo)}
            className="flex items-center gap-1 active:opacity-70 transition-opacity"
            style={{ color: 'rgba(180, 130, 0, 0.6)' }}
          >
            <Info className="w-3.5 h-3.5" />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>AI confidence score</span>
          </button>
        </div>

        {/* FIX 1: AI Confidence Info Popover */}
        <AnimatePresence>
          {showConfidenceInfo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 p-3 rounded-xl"
              style={{
                background: '#FFFDF5',
                border: '1px solid rgba(255,184,0,0.2)',
                fontSize: '12px',
                lineHeight: 1.5,
                color: 'rgba(0,0,0,0.6)',
              }}
            >
              AI confidence is calculated from course history, recent form, strokes gained metrics, and field strength. Higher scores indicate stronger statistical alignment with what this course rewards.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── #1 PICK — HERO CARD — Premium Gold Treatment ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl p-5 mb-3"
        style={{
          background: '#FFFDF5',
          border: '1px solid rgba(255, 184, 0, 0.25)',
          boxShadow: '0 2px 8px rgba(255, 184, 0, 0.08)',
        }}
      >
        {/* Gold inner glow pseudo-element */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.05) 0%, transparent 60%)',
          }}
        />

        <div className="relative flex items-start gap-3.5">
          {/* Avatar with #1 badge */}
          <div className="relative flex-shrink-0">
            {featured.avatarUrl ? (
              <img
                src={featured.avatarUrl}
                alt={featured.name}
                className="w-14 h-14 rounded-[14px] object-cover"
                style={{ border: '2px solid rgba(255, 184, 0, 0.3)' }}
                loading="eager"
              />
            ) : (
              <div 
                className={`w-14 h-14 rounded-[14px] ${avatarColors[0]} flex items-center justify-center text-lg font-extrabold text-white tracking-tight`}
                style={{ border: '2px solid rgba(255, 184, 0, 0.3)' }}
              >
                {getInitials(featured.name)}
              </div>
            )}
            {/* #1 badge overlapping top-left */}
            <div 
              className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)' }}
            >
              1
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + country */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold tracking-tight text-foreground">
                {featured.name}
              </span>
              {featured.countryCode && (
                <span 
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-muted-foreground"
                  style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                >
                  {featured.countryCode}
                </span>
              )}
            </div>

            {/* Key achievement badge */}
            {featured.keyTag && (
              <div 
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-[5px] rounded-lg mb-3.5"
                style={{
                  background: 'rgba(255, 184, 0, 0.08)',
                  border: '1px solid rgba(255, 184, 0, 0.15)',
                  color: '#B8860B',
                }}
              >
                🏆 {featured.keyTag}
              </div>
            )}

            {/* Confidence bar */}
            <div className="mb-3.5">
              <ConfidenceProgress tier={featured.confidenceTier} variant="gold" />
            </div>

            {/* Reason bullets */}
            {featured.fitBullets.length > 0 && (
              <div className="flex flex-col gap-2">
                {featured.fitBullets.slice(0, 3).map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span 
                      className="text-[8px] mt-[5px] flex-shrink-0" 
                      style={{ color: '#B8860B' }}
                    >
                      ◆
                    </span>
                    <span className="text-[13px] leading-relaxed text-muted-foreground">
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── RUNNER-UP CARDS (#2-5) — Horizontal Scroll ── */}
      {contenderCards.length > 0 && (
        <div className="relative mb-3">
          <div 
            className="-mx-4 px-4 pb-2"
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              touchAction: 'pan-x',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            <div className="flex gap-2.5" style={{ width: 'max-content' }}>
              {contenderCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.3 + i * 0.1, 
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  viewport={{ once: true }}
                  whileTap={{ scale: 0.98 }}
                  className="w-[220px] flex-shrink-0 rounded-[14px] p-4 cursor-pointer bg-card border border-border"
                  style={{
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    scrollSnapAlign: 'start',
                  }}
                >
                  {/* Avatar with rank badge */}
                  <div className="relative mb-3 inline-block">
                    {card.avatarUrl ? (
                      <img
                        src={card.avatarUrl}
                        alt={card.name}
                        className="w-12 h-12 rounded-xl object-cover border border-border"
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        className={`w-12 h-12 rounded-xl ${avatarColors[(i + 1) % avatarColors.length]} flex items-center justify-center text-sm font-extrabold text-white border border-border`}
                      >
                        {getInitials(card.name)}
                      </div>
                    )}

                    {/* Rank badge */}
                    <div 
                      className="absolute -top-1 -left-1 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={getRankBadgeStyle(card.rank || i + 2)}
                    >
                      {card.rank || i + 2}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="text-[15px] font-bold tracking-tight mb-0.5 text-foreground">
                    {card.name}
                  </div>

                  {/* Country */}
                  {card.countryCode && (
                    <div className="text-[10px] font-medium mb-2 text-muted-foreground/60">
                      {card.countryCode}
                    </div>
                  )}

                  {/* Confidence bar — blue for runners-up */}
                  {card.confidenceTier && (
                    <div className="mb-2">
                      <ConfidenceProgress tier={card.confidenceTier} variant="neutral" />
                    </div>
                  )}

                  {/* Description — max 2 lines */}
                  <p 
                    className="text-xs leading-relaxed m-0 text-muted-foreground"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {card.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Right fade hint */}
          <div 
            className="absolute top-0 right-0 bottom-0 w-10 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to left, hsl(var(--background)) 0%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* ── DARK HORSE CARDS — Reframed with Lightning Bolt ── */}
      {threatCards.length > 0 && (
        <div className="relative">
          <div 
            className="-mx-4 px-4 pb-2"
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              touchAction: 'pan-x',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            <div className="flex gap-2.5" style={{ width: 'max-content' }}>
              {threatCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.4 + i * 0.1, 
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  viewport={{ once: true }}
                  whileTap={{ scale: 0.98 }}
                  className="w-[220px] flex-shrink-0 rounded-[14px] p-4 cursor-pointer"
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    scrollSnapAlign: 'start',
                  }}
                >
                  {/* Avatar with lightning badge */}
                  <div className="relative mb-3 inline-block">
                    {card.avatarUrl ? (
                      <img
                        src={card.avatarUrl}
                        alt={card.name}
                        className="w-12 h-12 rounded-xl object-cover"
                        style={{ border: '1px solid rgba(245, 158, 11, 0.15)' }}
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        className={`w-12 h-12 rounded-xl ${avatarColors[(i + 1) % avatarColors.length]} flex items-center justify-center text-sm font-extrabold text-white`}
                        style={{ border: '1px solid rgba(245, 158, 11, 0.15)' }}
                      >
                        {getInitials(card.name)}
                      </div>
                    )}

                    {/* Lightning badge */}
                    <div 
                      className="absolute -top-1 -left-1 w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(245, 158, 11, 0.1)' }}
                    >
                      <Zap className="w-3 h-3" style={{ color: '#D97706' }} />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="text-[15px] font-bold tracking-tight mb-0.5 text-foreground">
                    {card.name}
                  </div>

                  {/* Country */}
                  {card.countryCode && (
                    <div className="text-[10px] font-medium mb-2 text-muted-foreground/60">
                      {card.countryCode}
                    </div>
                  )}

                  {/* DARK HORSE badge — reframed with lightning */}
                  <div 
                    className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md mb-2"
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                      color: '#D97706',
                      letterSpacing: '0.8px',
                    }}
                  >
                    <Zap className="w-2.5 h-2.5" />
                    DARK HORSE
                  </div>

                  {/* Description — max 2 lines */}
                  <p 
                    className="text-xs leading-relaxed m-0 text-muted-foreground"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {card.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Right fade hint */}
          <div 
            className="absolute top-0 right-0 bottom-0 w-10 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to left, hsl(var(--background)) 0%, transparent 100%)',
            }}
          />
        </div>
      )}
    </div>
  );
});
