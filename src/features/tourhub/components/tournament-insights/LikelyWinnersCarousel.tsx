/**
 * TopPicksCarousel — Immersive portrait cards with dark glass + course image background
 * Photo fills top 55-60%, fades into dark glass, insights below
 * z-index layers: 0=bg image, 1=glass overlay, 2=content
 */

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import CountryFlag from '@/components/ui/country-flag';
import type { WinnerProfile, ContenderCard } from './types';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';

import { PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

interface LikelyWinnersCarouselProps {
  featured: WinnerProfile;
  cards: ContenderCard[];
  withdrawnPlayerIds?: Set<string>;
  courseName?: string;
  tournamentName?: string;
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
  courseName,
  tournamentName,
}: LikelyWinnersCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch course image for card backgrounds
  const venueImageQuery = useVenueImage(courseName ?? null, null);
  const courseImageUrl =
    venueImageQuery.data?.imageUrl || (tournamentName ? getFallbackCourseImage(tournamentName) : undefined);

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
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 items-stretch"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {allPicks.map((pick, i) => {
          const imgFailed = failedImages.has(pick.id) || !pick.avatarUrl;

          return (
            <div
              key={pick.id}
              className="flex-shrink-0 snap-center"
              style={{
                width: 227,
                borderRadius: 16,
                ...(i === 0 ? {
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.25), 0 0 40px rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.20)',
                } : {}),
              }}
            >
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full rounded-[16px] overflow-hidden flex flex-col relative"
              style={{ background: '#1a1a1a', minHeight: 390 }}
            >
              {/* Pre-blurred course image background — no backdrop-filter */}
              {courseImageUrl && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    zIndex: 0,
                    top: '-20px',
                    left: '-20px',
                    right: '-20px',
                    bottom: '-20px',
                  }}
                >
                  <img
                    src={courseImageUrl}
                    alt=""
                    aria-hidden="true"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'blur(20px)',
                      WebkitFilter: 'blur(20px)',
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              {/* Dark tint overlay — solid, no backdrop-filter */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: 1,
                  background: 'rgba(0, 0, 0, 0.45)',
                }}
              />

              {/* Photo section — top ~48% */}
              <div className="relative flex-shrink-0" style={{ height: 170, zIndex: 2 }}>
                {imgFailed ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                      borderRadius: '16px 16px 0 0',
                    }}
                  >
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                      {getInitials(pick.name)}
                    </span>
                  </div>
                ) : (
                  <img
                    src={pick.avatarUrl}
                    alt={pick.name}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: 'center 20%',
                      borderRadius: '16px 16px 0 0',
                      opacity: pick.isWithdrawn ? 0.4 : 1,
                    }}
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(pick.id)}
                  />
                )}

                {/* Fade gradient — transitions into dark glass */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 55%, rgba(0, 0, 0, 0.6) 100%)',
                  }}
                />

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

              </div>

              {/* Name + Flag + Bullets — on dark glass */}
              <div className="flex flex-col flex-1 overflow-hidden relative" style={{ padding: '0 16px 14px', zIndex: 2, justifyContent: 'flex-start' }}>
                {/* Name */}
                <p className="text-center" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2, marginTop: 6, color: '#FFFFFF' }}>
                  {pick.name}
                </p>
                {/* Flag */}
                {pick.countryCode && (
                  <div className="flex justify-center" style={{ marginTop: 2, fontSize: 13 }}>
                    <CountryFlag
                      country={pick.countryCode}
                      size="sm"
                      className="rounded-sm"
                    />
                  </div>
                )}

                {/* Confidence pill */}
                <div className="flex justify-center" style={{ marginTop: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: 999,
                      padding: '4px 12px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {pick.confidenceTier === 'elite' ? '95' : pick.confidenceTier === 'high' ? '88' : '78'}% MATCH
                  </span>
                </div>

                {/* Insights with hairline dividers */}
                {pick.bullets.length > 0 && (
                  <div className="flex flex-col" style={{ marginTop: 10 }}>
                    {pick.bullets.slice(0, 3).map((bullet, j) => (
                      <div key={j}>
                        {j > 0 && (
                          <div className="mx-auto" style={{ width: '80%', height: 0.5, background: 'rgba(255, 255, 255, 0.10)', margin: '10px auto' }} />
                        )}
                        <p
                          className="text-center"
                          style={{
                            fontSize: 13,
                            fontWeight: 400,
                            lineHeight: 1.4,
                            color: 'rgba(255, 255, 255, 0.85)',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
            </div>
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
