/**
 * TopPicksCarousel (formerly LikelyWinnersCarousel)
 * Premium player scouting cards with confidence gauges.
 * Phase 6 refinements: top accent bar, 52px gauge, dot bullets, pill pagination
 */

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import type { WinnerProfile, ContenderCard } from './types';
import ConfidenceGauge from './components/ConfidenceGauge';
import { PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

interface LikelyWinnersCarouselProps {
  featured: WinnerProfile;
  cards: ContenderCard[];
  withdrawnPlayerIds?: Set<string>;
}

interface PickCard {
  id: string;
  name: string;
  countryCode?: string;
  avatarUrl: string;
  confidenceTier: 'elite' | 'high' | 'medium';
  bullets: string[];
  promoted?: boolean;
  isWithdrawn?: boolean;
}

// Accent colors: gold for #1, green for #2-3, slate for #4-5
const ACCENT_COLORS = ['#D97706', '#16A34A', '#16A34A', '#94A3B8', '#94A3B8'];
const ACCENT_GRADIENTS = [
  'linear-gradient(90deg, #D97706, rgba(217,119,6,0.5))',
  'linear-gradient(90deg, #16A34A, rgba(22,163,74,0.5))',
  'linear-gradient(90deg, #16A34A, rgba(22,163,74,0.5))',
  'linear-gradient(90deg, #94A3B8, rgba(148,163,184,0.5))',
  'linear-gradient(90deg, #94A3B8, rgba(148,163,184,0.5))',
];

export const LikelyWinnersCarousel = memo(function LikelyWinnersCarousel({
  featured,
  cards,
  withdrawnPlayerIds,
}: LikelyWinnersCarouselProps) {
  const [showConfidenceInfo, setShowConfidenceInfo] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  const contenderCards = cards.filter(c => c.type === 'contender').slice(0, 4);

  const allPicks: PickCard[] = [
    {
      id: featured.id,
      name: featured.name,
      countryCode: featured.countryCode,
      avatarUrl: featured.avatarUrl,
      confidenceTier: featured.confidenceTier,
      bullets: featured.fitBullets.slice(0, 3),
      promoted: featured.promoted,
      isWithdrawn: withdrawnPlayerIds?.has(featured.id) ?? false,
    },
    ...contenderCards.map(c => ({
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      avatarUrl: c.avatarUrl,
      confidenceTier: c.confidenceTier ?? ('medium' as const),
      bullets: c.fitBullets?.slice(0, 3) || (c.description ? [c.description] : []),
      promoted: c.promoted,
      isWithdrawn: withdrawnPlayerIds?.has(c.id) ?? false,
    })),
  ];

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

  useEffect(() => {
    hasAnimatedRef.current = true;
  }, []);

  return (
    <div>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="mb-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-foreground" style={{ fontSize: '18px', fontWeight: 700 }}>
            Top 5 Picks
          </h3>
          <button
            onClick={() => setShowConfidenceInfo(!showConfidenceInfo)}
            className="flex items-center gap-1 active:opacity-70 transition-opacity text-muted-foreground/60"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <AnimatePresence>
          {showConfidenceInfo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 p-3 rounded-xl bg-card border border-border/50"
              style={{ fontSize: '12px', lineHeight: 1.5 }}
            >
              <span className="text-muted-foreground">
                AI confidence is calculated from course history, recent form, strokes gained metrics, and field strength.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Swipeable carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 pb-2 -mx-4 px-4"
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
        {allPicks.map((pick, i) => {
          const isFeatured = i === 0;
          const accentColor = ACCENT_COLORS[i] ?? '#94A3B8';
          const accentGradient = ACCENT_GRADIENTS[i] ?? ACCENT_GRADIENTS[4];

          return (
            <motion.div
              key={pick.id}
              initial={hasAnimatedRef.current ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: pick.isWithdrawn ? 0.6 : 1, y: 0 }}
              transition={{
                delay: hasAnimatedRef.current ? 0 : 0.08 * i,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
              className="rounded-2xl flex-shrink-0 relative overflow-hidden bg-card"
              style={{
                width: isFeatured ? 'calc(100% - 28px)' : 'calc(100% - 36px)',
                minWidth: isFeatured ? 'calc(100% - 28px)' : 'calc(100% - 36px)',
                scrollSnapAlign: 'start',
                border: '1px solid hsl(var(--border) / 0.4)',
                opacity: pick.isWithdrawn ? 0.6 : undefined,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {/* Top accent bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: accentGradient,
                  borderRadius: '16px 16px 0 0',
                }}
              />

              {/* Avatar + Name row */}
              <div className="flex items-start gap-3.5 p-5 pb-0">
                <div className="relative flex-shrink-0">
                  <img
                    src={pick.avatarUrl || PLAYER_SILHOUETTE_URL}
                    alt={pick.name}
                    className="object-cover"
                    style={{
                      width: isFeatured ? 72 : 60,
                      height: isFeatured ? 72 : 60,
                      borderRadius: '34%',
                      objectPosition: 'center 20%',
                      border: `2px solid ${accentColor}`,
                    }}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                  />
                  {pick.isWithdrawn && (
                    <div
                      className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-md font-bold uppercase"
                      style={{
                        fontSize: '9px',
                        letterSpacing: '0.5px',
                        background: '#EF4444',
                        color: 'white',
                        lineHeight: 1.2,
                      }}
                    >
                      WD
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className="block tracking-tight text-foreground"
                    style={{
                      fontSize: isFeatured ? 18 : 16,
                      fontWeight: isFeatured ? 600 : 500,
                      lineHeight: 1.2,
                      marginBottom: 4,
                    }}
                  >
                    {pick.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {pick.countryCode && (
                      <CountryFlag country={pick.countryCode} size="sm" className="rounded-sm" />
                    )}
                    {pick.promoted && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block"
                        style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: 'rgb(59, 130, 246)',
                        }}
                      >
                        Promoted pick
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span
                    className="text-muted-foreground"
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      opacity: 0.6,
                    }}
                  >
                    AI CONFIDENCE
                  </span>
                  <ConfidenceGauge
                    tier={pick.confidenceTier}
                    accentColor={accentColor}
                    animationDelay={400 + i * 80}
                    isWithdrawn={pick.isWithdrawn}
                    size={52}
                  />
                </div>
              </div>

              {/* Bullet points with colored dots */}
              {pick.bullets.length > 0 && (
                <div className="flex flex-col gap-2.5 px-5 pb-5 pt-3">
                  {pick.bullets.slice(0, 3).map((bullet, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span
                        className="flex-shrink-0"
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          marginTop: 7,
                          backgroundColor: j === 0 ? accentColor : 'hsl(var(--muted-foreground))',
                        }}
                      />
                      <span
                        className="text-muted-foreground"
                        style={{ fontSize: 14, lineHeight: 1.625 }}
                      >
                        {bullet}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Pagination dots — active = 16px pill */}
      {allPicks.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {allPicks.map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === activeIndex ? '16px' : '6px',
                height: '6px',
                background: i === activeIndex
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--border))',
                transition: 'width 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});
