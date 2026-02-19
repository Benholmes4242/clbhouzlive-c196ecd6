/**
 * TopPicksCarousel (formerly LikelyWinnersCarousel)
 * Single-card swipeable carousel: 4 top picks, no dark horses
 * Each card full-width, peek next card, dot indicators
 */

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import type { WinnerProfile, ContenderCard } from './types';
import ConfidenceProgress from './components/ConfidenceProgress';

interface LikelyWinnersCarouselProps {
  featured: WinnerProfile;
  cards: ContenderCard[];
}

interface PickCard {
  id: string;
  name: string;
  countryCode?: string;
  avatarUrl: string;
  confidenceTier: 'elite' | 'high' | 'medium';
  bullets: string[];
}

export const LikelyWinnersCarousel = memo(function LikelyWinnersCarousel({
  featured,
  cards,
}: LikelyWinnersCarouselProps) {
  const [showConfidenceInfo, setShowConfidenceInfo] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build unified pick list: featured + 3 contenders = 4 total
  const contenderCards = cards.filter(c => c.type === 'contender').slice(0, 3);

  const allPicks: PickCard[] = [
    {
      id: featured.id,
      name: featured.name,
      countryCode: featured.countryCode,
      avatarUrl: featured.avatarUrl,
      confidenceTier: featured.confidenceTier,
      bullets: featured.fitBullets.slice(0, 3),
    },
    ...contenderCards.map(c => ({
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      avatarUrl: c.avatarUrl,
      confidenceTier: c.confidenceTier ?? ('medium' as const),
      bullets: c.fitBullets?.slice(0, 3) || (c.description ? [c.description] : []),
    })),
  ];

  // Track scroll for dot indicators
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth - 20;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, allPicks.length - 1));
  }, [allPicks.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917' }}>
            Top Picks
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

      {/* Swipeable carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 pb-2 -mx-4 px-4"
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollPaddingLeft: '16px',
        }}
      >
        {allPicks.map((pick, i) => (
          <motion.div
            key={pick.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="rounded-2xl p-5 flex-shrink-0 bg-card border border-border"
            style={{
              width: 'calc(100% - 36px)',
              minWidth: 'calc(100% - 36px)',
              scrollSnapAlign: 'start',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Avatar + Name row */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="relative flex-shrink-0">
                {pick.avatarUrl ? (
                  <img
                    src={pick.avatarUrl}
                    alt={pick.name}
                    className="w-14 h-14 rounded-[14px] object-cover border border-border"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-[14px] bg-muted border border-border" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg font-bold tracking-tight text-foreground">
                    {pick.name}
                  </span>
                </div>
                {pick.countryCode && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-muted-foreground inline-block"
                    style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                  >
                    {pick.countryCode}
                  </span>
                )}
              </div>
            </div>

            {/* Confidence bar */}
            <div className="mb-4">
              <ConfidenceProgress tier={pick.confidenceTier} variant={i === 0 ? 'gold' : 'neutral'} />
            </div>

            {/* Bullet points */}
            {pick.bullets.length > 0 && (
              <div className="flex flex-col gap-2">
                {pick.bullets.slice(0, 3).map((bullet, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="text-[8px] mt-[5px] flex-shrink-0" style={{ color: '#B8860B' }}>
                      ◆
                    </span>
                    <span className="text-[13px] leading-relaxed text-muted-foreground">
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Dot indicators */}
      {allPicks.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {allPicks.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === activeIndex ? '16px' : '6px',
                height: '6px',
                background: i === activeIndex ? '#B8860B' : 'rgba(0,0,0,0.12)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});