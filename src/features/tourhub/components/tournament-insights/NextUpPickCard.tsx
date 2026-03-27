/**
 * NextUpPickCard — Editorial full-width pick cards for Next Up predictions.
 * Matches TournamentResultsCard visual language: player portrait right side
 * masked left, dark semantic text on light surface, stats grid, AI tips.
 * Swipeable via pagination dots. Stats from useWinnerSeasonStats per-pick.
 */

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWinnerSeasonStats } from '../../hooks/useWinnerSeasonStats';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import CountryFlag from '@/components/ui/country-flag';
import type { WinnerProfile, ContenderCard } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NextUpPickCardProps {
  featured: WinnerProfile;
  cards: ContenderCard[];
  withdrawnPlayerIds?: Set<string>;
}

interface PickItem {
  id: string;
  name: string;
  countryCode?: string;
  avatarUrl: string;
  confidenceTier: 'elite' | 'high' | 'medium';
  matchPct: number;
  bullets: string[];
  isWithdrawn?: boolean;
  promoted?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tierToPct(tier: 'elite' | 'high' | 'medium'): number {
  return tier === 'elite' ? 95 : tier === 'high' ? 88 : 78;
}

function tierDotColor(tier: 'elite' | 'high' | 'medium'): string {
  return tier === 'elite' ? '#16A34A' : tier === 'high' ? '#2563EB' : '#9CA3AF';
}

// ─── Stat chip ───────────────────────────────────────────────────────────────

function StatChip({
  value,
  label,
  unit,
}: {
  value: number | null | undefined;
  label: string;
  unit?: string;
}) {
  if (!value) return null;
  const display =
    unit === 'yds' ? Math.round(value).toString()
    : unit === '%' ? Math.round(value).toString()
    : value.toFixed(2);
  return (
    <div
      style={{
        flex: 1,
        textAlign: 'center' as const,
        padding: '8px 4px 6px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: 'hsl(var(--foreground))',
          lineHeight: 1,
        }}
      >
        {display}
        {unit && (
          <span style={{ color: 'hsl(var(--foreground))' }}>
            {unit}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: 'uppercase' as const,
          color: 'hsl(var(--foreground))',
          marginTop: 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Single pick slide ────────────────────────────────────────────────────────

function PickSlide({ pick, index, totalPicks, onNav }: { pick: PickItem; index: number; totalPicks: number; onNav: (dir: number) => void }) {
  const { data: stats } = useWinnerSeasonStats(pick.id);

  const photo =
    getPlayerHeadshotUrl(pick.name, 'pga') ||
    pick.avatarUrl ||
    PLAYER_SILHOUETTE_URL;

  const hasStats = stats && (
    stats.drivingDistance || stats.drivingAccuracy ||
    stats.greensInReg || stats.puttingAverage
  );

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 1 — PLAYER HERO */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', overflow: 'visible' }}>
        {/* Navigation chevrons */}
        {totalPicks > 1 && (
          <>
            {index > 0 && (
              <button
                onClick={() => onNav?.(-1)}
                style={{
                  position: 'absolute',
                  left: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  opacity: 0.5,
                }}
              >
                <ChevronLeft size={22} color="hsl(var(--foreground))" />
              </button>
            )}
            {index < totalPicks - 1 && (
              <button
                onClick={() => onNav?.(1)}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  opacity: 0.5,
                }}
              >
                <ChevronRight size={22} color="hsl(var(--foreground))" />
              </button>
            )}
          </>
        )}
        {/* Player portrait — right side, full bleed, no fade (matches Results hero) */}
        <div
          style={{
            position: 'absolute',
            top: -16,
            right: -16,
            width: '60%',
            height: '100%',
            zIndex: 0,
          }}
        >
          <img
            src={photo}
            alt={pick.name}
            onError={e => {
              (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL;
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: '50% 8%',
              display: 'block',
              opacity: pick.isWithdrawn ? 0.30 : 1,
            }}
          />
        </div>

        {/* Left column — pick info */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px 12px 20px 16px',
            width: '65%',
            minHeight: 264,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: 10,
          }}
        >
          {/* Eyebrow */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1.8,
            textTransform: 'uppercase' as const,
            color: 'hsl(var(--muted-foreground))',
            lineHeight: 1,
          }}>
            {index === 0
              ? 'Our Top Pick'
              : index === 1
              ? 'Strong Contender'
              : 'In Contention'}
          </div>

          {/* Player name */}
          <div style={{
            fontSize: 26, fontWeight: 900,
            color: 'hsl(var(--foreground))',
            letterSpacing: -0.8, lineHeight: 1.05,
          }}>
            {pick.name}
          </div>

          {/* Flag */}
          {pick.countryCode && (
            <CountryFlag country={pick.countryCode} size="sm" className="rounded-sm" />
          )}




          {/* Withdrawn badge if applicable */}
          {pick.isWithdrawn && (
            <div style={{
              display: 'inline-flex', alignSelf: 'flex-start',
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              color: '#EF4444',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.20)',
              borderRadius: 6, padding: '3px 8px',
              textTransform: 'uppercase' as const,
            }}>
              Withdrawn
            </div>
          )}
        </div>
      </div>

      {/* Match % pill — above stats row */}
      <div style={{ padding: '0 16px', marginTop: -72, position: 'relative', zIndex: 4, display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 700,
          color: 'hsl(var(--foreground))',
          textAlign: 'center' as const,
          padding: '8px 12px 6px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.75)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: tierDotColor(pick.confidenceTier),
            flexShrink: 0,
          }} />
          {pick.matchPct}% Match
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 2 — STATS GRID */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {hasStats && (
        <div
          style={{
            padding: '0 16px 8px',
            marginTop: -4,
            position: 'relative',
            zIndex: 4,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 5,
            }}
          >
            <StatChip value={stats.drivingDistance} label="Driver" unit="yds" />
            <StatChip value={stats.drivingAccuracy} label="Accuracy" unit="%" />
            <StatChip value={stats.greensInReg} label="GIR" unit="%" />
            <StatChip value={stats.puttingAverage} label="Putts" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 3 — AI TIPS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {pick.bullets.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div
            style={{
              height: 1,
              background: 'hsl(var(--border))',
              width: '33%',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 12,
            }}
          />
          {pick.bullets.slice(0, 3).map((b, j) => (
            <div key={j}>
              {j > 0 && (
                <div
                  style={{
                    height: 1,
                    background: 'hsl(var(--border))',
                    width: '33%',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginTop: 10,
                    marginBottom: 10,
                  }}
                />
              )}
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  margin: 0,
                  fontWeight: 500,
                  color: 'hsl(var(--foreground))',
                  textAlign: 'center',
                }}
              >
                {b}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function NextUpPickCard({
  featured,
  cards,
  withdrawnPlayerIds,
}: NextUpPickCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dragStartX = useRef<number>(0);
  const isDragging = useRef(false);

  const allPicks: PickItem[] = [
    {
      id: featured.id,
      name: featured.name,
      countryCode: featured.countryCode,
      avatarUrl: featured.avatarUrl,
      confidenceTier: featured.confidenceTier,
      matchPct: tierToPct(featured.confidenceTier),
      bullets: featured.fitBullets.slice(0, 3),
      isWithdrawn: withdrawnPlayerIds?.has(featured.id) ?? false,
      promoted: featured.promoted,
    },
    ...cards
      .filter(c => c.type === 'contender')
      .slice(0, 2)
      .map(c => ({
        id: c.id,
        name: c.name,
        countryCode: c.countryCode,
        avatarUrl: c.avatarUrl,
        confidenceTier: c.confidenceTier ?? ('medium' as const),
        matchPct: tierToPct(c.confidenceTier ?? 'medium'),
        bullets: c.fitBullets?.slice(0, 3) ||
          (c.description ? [c.description] : []),
        isWithdrawn: withdrawnPlayerIds?.has(c.id) ?? false,
        promoted: c.promoted,
      })),
  ];

  const current = allPicks[activeIndex];
  if (!current) return null;

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(allPicks.length - 1, index));
    setActiveIndex(clamped);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = e.changedTouches[0].clientX - dragStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }
  };

  return (
    <div
      style={{ paddingBottom: 8, userSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Active pick */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.id}-${activeIndex}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <PickSlide pick={current} index={activeIndex} totalPicks={allPicks.length} onNav={(dir) => goTo(activeIndex + dir)} />
        </motion.div>
      </AnimatePresence>

      {/* Pagination dots */}
      {allPicks.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '14px 16px 4px',
          }}
        >
          {allPicks.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeIndex
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--border))',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.25s ease',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
