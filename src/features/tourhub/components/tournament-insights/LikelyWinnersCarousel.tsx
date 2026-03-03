/**
 * TopPicksCarousel — Portrait cards matching Personal Top 10 style
 * Gradient backgrounds with centered headshots, rank badges, and confidence rings
 */

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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

const ACCENT_COLOR = '#16A34A';

export const LikelyWinnersCarousel = memo(function LikelyWinnersCarousel({
  featured,
  cards,
  withdrawnPlayerIds,
}: LikelyWinnersCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    const scrollLeft = el.scrollLeft;
    const cardWidth = 227 + 16; // card width + gap
    const idx = Math.round(scrollLeft / cardWidth);
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
      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {allPicks.map((pick, i) => (
          <motion.div
            key={pick.id}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-[227px] h-[292px] rounded-[22px] overflow-hidden flex-shrink-0 snap-center"
            style={{
              background: 'linear-gradient(165deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)',
              opacity: pick.isWithdrawn ? 0.6 : 1,
            }}
          >
            {/* Green accent bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: ACCENT_COLOR,
                borderRadius: '22px 22px 0 0',
              }}
            />

            {/* Rank badge — top-left */}
            <div
              className="absolute top-4 left-4 flex items-center px-3 py-1.5 rounded-full"
              style={{
                background: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <span className="text-foreground font-semibold text-sm">#{i + 1}</span>
            </div>

            {/* Confidence ring — top-right */}
            <div className="absolute top-3 right-3">
              <ConfidenceGauge
                tier={pick.confidenceTier}
                accentColor={ACCENT_COLOR}
                animationDelay={400 + i * 80}
                isWithdrawn={pick.isWithdrawn}
                size={44}
              />
            </div>

            {/* WD badge */}
            {pick.isWithdrawn && (
              <div
                className="absolute top-12 left-4 px-1.5 py-0.5 rounded-md font-bold uppercase"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.5px',
                  background: '#EF4444',
                  color: 'white',
                  lineHeight: 1.2,
                }}
              >
                WD
              </div>
            )}

            {/* Center content — avatar, name, flag */}
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 48, paddingBottom: 80 }}>
              {/* Player headshot */}
              <div className="relative flex-shrink-0">
                <img
                  src={pick.avatarUrl || PLAYER_SILHOUETTE_URL}
                  alt={pick.name}
                  className="object-cover"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    objectPosition: 'center 20%',
                    border: '2px solid hsl(var(--border))',
                  }}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                />
              </div>

              {/* Player name */}
              <p
                className="text-foreground text-center truncate w-full px-4"
                style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}
              >
                {pick.name}
              </p>

              {/* Flag + promoted */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {pick.countryCode && (
                  <CountryFlag country={pick.countryCode} size="sm" className="rounded-sm" />
                )}
                {pick.promoted && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      color: 'rgb(59, 130, 246)',
                    }}
                  >
                    Promoted
                  </span>
                )}
              </div>
            </div>

            {/* Insight bullets — bottom */}
            {pick.bullets.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1.5 px-4 pb-4">
                {pick.bullets.slice(0, 3).map((bullet, j) => (
                  <div key={j} className="flex items-start gap-1.5">
                    <span
                      className="flex-shrink-0"
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        marginTop: 5,
                        backgroundColor: ACCENT_COLOR,
                      }}
                    />
                    <span
                      className="text-muted-foreground truncate"
                      style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}
                    >
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pagination dots — match Personal Top 10 */}
      {allPicks.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {allPicks.map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                i === activeIndex ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-primary/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
});
