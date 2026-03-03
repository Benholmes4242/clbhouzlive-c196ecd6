/**
 * TopPicksCarousel — Immersive portrait cards with player photo backgrounds
 * Photo fills top 55-60%, fades into card background, insights below
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

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export const LikelyWinnersCarousel = memo(function LikelyWinnersCarousel({
  featured,
  cards,
  withdrawnPlayerIds,
}: LikelyWinnersCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
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
    const cardWidth = 227 + 16;
    const idx = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, allPicks.length - 1));
  }, [allPicks.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleImageError = useCallback((id: string) => {
    setFailedImages(prev => new Set(prev).add(id));
  }, []);

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
        {allPicks.map((pick, i) => {
          const imgFailed = failedImages.has(pick.id) || !pick.avatarUrl;

          return (
            <motion.div
              key={pick.id}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-[227px] h-[292px] rounded-[22px] overflow-hidden flex-shrink-0 snap-center flex flex-col"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border) / 0.2)',
              }}
            >
              {/* Photo section — top ~45% */}
              <div className="relative flex-shrink-0" style={{ height: '45%' }}>
                {imgFailed ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--border)) 100%)',
                      borderRadius: '22px 22px 0 0',
                    }}
                  >
                    <span className="text-muted-foreground" style={{ fontSize: 24, fontWeight: 700 }}>
                      {getInitials(pick.name)}
                    </span>
                  </div>
                ) : (
                  <img
                    src={pick.avatarUrl}
                    alt={pick.name}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: 'center 15%',
                      borderRadius: '22px 22px 0 0',
                      opacity: pick.isWithdrawn ? 0.4 : 1,
                    }}
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(pick.id)}
                  />
                )}

                {/* WD badge */}
                {pick.isWithdrawn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="font-bold uppercase"
                      style={{
                        fontSize: 14,
                        letterSpacing: '1px',
                        background: '#EF4444',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 8,
                      }}
                    >
                      WD
                    </span>
                  </div>
                )}

                {/* Promoted pill */}
                {pick.promoted && (
                  <div
                    className="absolute top-3 left-3 text-xs font-semibold rounded-full"
                    style={{
                      padding: '2px 8px',
                      background: 'rgba(22, 163, 74, 0.15)',
                      color: ACCENT_COLOR,
                    }}
                  >
                    Promoted
                  </div>
                )}

                {/* Confidence ring — top-right, 38px */}
                <div
                  className="absolute"
                  style={{
                    top: 10,
                    right: 10,
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
                  }}
                >
                  <ConfidenceGauge
                    tier={pick.confidenceTier}
                    accentColor={ACCENT_COLOR}
                    animationDelay={400 + i * 80}
                    isWithdrawn={pick.isWithdrawn}
                    size={38}
                  />
                </div>
              </div>

              {/* Name + Flag + Bullets — natural flow, no overlap */}
              <div className="flex flex-col flex-1 overflow-hidden" style={{ padding: '0 14px 14px' }}>
                {/* Player name */}
                <p className="text-foreground text-center" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, marginTop: 4 }}>
                  {pick.name}
                </p>

                {/* Flag */}
                {pick.countryCode && (
                  <div className="flex justify-center" style={{ marginTop: 1 }}>
                    <CountryFlag
                      country={pick.countryCode}
                      size="sm"
                      className="rounded-sm"
                    />
                  </div>
                )}

                {/* Bullets */}
                {pick.bullets.length > 0 && (
                  <div className="flex flex-col overflow-hidden" style={{ marginTop: 10, gap: 4 }}>
                    {pick.bullets.slice(0, 3).map((bullet, j) => (
                      <div key={j} className="flex items-start" style={{ gap: 6 }}>
                        <span
                          className="flex-shrink-0"
                          style={{
                            width: 3.5,
                            height: 3.5,
                            borderRadius: '50%',
                            marginTop: 5,
                            backgroundColor: ACCENT_COLOR,
                          }}
                        />
                        <span
                          className="text-muted-foreground"
                          style={{
                            fontSize: 11.5,
                            fontWeight: 500,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {bullet}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination dots */}
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
