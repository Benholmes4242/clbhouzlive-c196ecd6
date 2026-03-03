/**
 * BestPickSpotlight — Hero spotlight card for the best-performing pick in a
 * finished tournament. Lighter frosted-glass treatment with green accent glow,
 * course image background, and full tournament + performance stats.
 *
 * Replaces the old ResultsRecap (progress ring + stat pills + best-call line).
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useWinnerScorecardStats } from '../../hooks/useWinnerScorecardStats';
import { useWinnerSeasonStats } from '../../hooks/useWinnerSeasonStats';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import CountryFlag from '@/components/ui/country-flag';
import type { TrackedPrediction } from './types';

/* ── Types ──────────────────────────────────────────────────────────── */

interface BestPickSpotlightProps {
  bestPick: TrackedPrediction;
  tournamentId: string;
  courseName: string;
  tournamentName: string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatScore(score: number | null): string {
  if (score === null) return '—';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

/* ── Inner stat chip (lighter glass variant) ────────────────────────── */

function SpotlightStatChip({
  value,
  label,
  suffix,
  color,
}: {
  value: string | number;
  label: string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '8px 4px',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: color ?? '#FFFFFF',
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
        {suffix && (
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.65 }}>
            {suffix}
          </span>
        )}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.45)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Section label ──────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: 'rgba(255, 255, 255, 0.25)',
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

export const BestPickSpotlight: React.FC<BestPickSpotlightProps> = ({
  bestPick,
  tournamentId,
  courseName,
  tournamentName,
}) => {
  // Resolve the Sportradar player ID for stats lookup
  const playerId = bestPick.playerId;

  // Fetch tournament scorecard stats (birdies, pars, bogeys)
  const { data: tournamentStats } = useWinnerScorecardStats(tournamentId, playerId);

  // Fetch season performance averages (driver, fairways, GIR, putts)
  const { data: seasonStats } = useWinnerSeasonStats(playerId);

  // Fetch course image for card background
  const venueImageQuery = useVenueImage(courseName, null);
  const courseImageUrl =
    venueImageQuery.data?.imageUrl || getFallbackCourseImage(tournamentName);

  // Player headshot
  const avatarUrl = getPlayerHeadshotUrl(bestPick.playerName, 'pga') || PLAYER_SILHOUETTE_URL;

  // Finish text
  const isWinner = bestPick.actualPosition === 1;
  const finishText = isWinner
    ? 'Won the tournament'
    : bestPick.actualPosition !== null
      ? `Finished ${bestPick.actualPositionTied ? 'T' : ''}${getOrdinal(bestPick.actualPosition)}`
      : '—';

  // Stats availability
  const hasTournamentStats = !!tournamentStats;
  const hasSeasonStats = !!(
    seasonStats &&
    (seasonStats.drivingDistance ||
      seasonStats.drivingAccuracy ||
      seasonStats.greensInReg ||
      seasonStats.puttingAverage)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        /* Green accent border + glow */
        border: '1px solid rgba(34, 197, 94, 0.3)',
        boxShadow: '0 0 12px rgba(34, 197, 94, 0.25), 0 8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* ── Background: course image + lighter overlay ──────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: courseImageUrl ? `url(${courseImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Lighter frosted glass overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.52)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        }}
      />

      {/* ── Content ────────────────────────────────────────────── */}
      <div style={{ position: 'relative', padding: '16px 16px 14px' }}>
        {/* BEST PICK badge */}
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 8,
              background: '#22C55E',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              lineHeight: 1,
            }}
          >
            ★ Best Pick
          </span>
        </div>

        {/* Player identity row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: hasTournamentStats || hasSeasonStats ? 16 : 0,
          }}
        >
          {/* Avatar 48px circle */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <img
              src={avatarUrl}
              alt={bestPick.playerName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 20%',
              }}
              onError={(e) => {
                e.currentTarget.src = PLAYER_SILHOUETTE_URL;
              }}
            />
          </div>

          {/* Name + finish */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {bestPick.playerName}
              </span>
              <CountryFlag country={bestPick.country} size="sm" />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: 2,
                display: 'block',
              }}
            >
              {finishText}
            </span>
          </div>

          {/* Score — right-aligned */}
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              flexShrink: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {formatScore(bestPick.score)}
          </span>
        </div>

        {/* ── Tournament Stats (Birdies / Pars / Bogeys) ──────── */}
        {hasTournamentStats && (
          <div style={{ marginTop: 4 }}>
            <SectionLabel>Tournament</SectionLabel>
            <div style={{ display: 'flex', gap: 6 }}>
              {tournamentStats!.eagles > 0 && (
                <SpotlightStatChip
                  value={tournamentStats!.eagles}
                  label={tournamentStats!.eagles === 1 ? 'Eagle' : 'Eagles'}
                  color="rgba(250, 204, 21, 0.9)"
                />
              )}
              <SpotlightStatChip
                value={tournamentStats!.birdies}
                label="Birdies"
                color="rgba(74, 222, 128, 0.9)"
              />
              <SpotlightStatChip value={tournamentStats!.pars} label="Pars" />
              {tournamentStats!.bogeys > 0 && (
                <SpotlightStatChip
                  value={tournamentStats!.bogeys}
                  label="Bogeys"
                  color="rgba(251, 146, 60, 0.75)"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Performance Averages ────────────────────────────── */}
        {hasSeasonStats && (
          <div style={{ marginTop: hasTournamentStats ? 10 : 4 }}>
            <SectionLabel>Performance Averages</SectionLabel>
            <div style={{ display: 'flex', gap: 6 }}>
              {seasonStats!.drivingDistance && (
                <SpotlightStatChip
                  value={Math.round(seasonStats!.drivingDistance)}
                  label="Driver"
                  suffix="yds"
                />
              )}
              {seasonStats!.drivingAccuracy && (
                <SpotlightStatChip
                  value={Math.round(seasonStats!.drivingAccuracy).toString()}
                  label="Fairways"
                  suffix="%"
                />
              )}
              {seasonStats!.greensInReg && (
                <SpotlightStatChip
                  value={Math.round(seasonStats!.greensInReg).toString()}
                  label="GIR"
                  suffix="%"
                />
              )}
              {seasonStats!.puttingAverage && (
                <SpotlightStatChip
                  value={seasonStats!.puttingAverage.toFixed(2)}
                  label="Putts"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
