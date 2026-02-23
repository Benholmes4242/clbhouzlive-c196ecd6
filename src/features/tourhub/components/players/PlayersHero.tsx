/**
 * PlayersHero - Immersive full-bleed #1 player hero.
 * Aligned with Tour Overview audit typography & spacing.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { openTourNav } from '../../contexts/TourNavContext';
import { cn } from '@/lib/utils';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import { useSwipeable } from 'react-swipeable';
import type { ElitePlayer } from '../../hooks/useElitePlayers';
import type { PlayerTourCode } from './PlayersTourFilter';
import type { PlayerSortType } from './PlayerSortControl';

interface PlayersHeroProps {
  players: ElitePlayer[];
  activeTour: PlayerTourCode;
  /** Stats map: playerId → { earnings, wins, tourRank, points, tournamentsPlayed } */
  statsMap?: Map<string, { earnings: number | null; wins: number | null; tourRank: number | null; points?: number | null; tournamentsPlayed?: number | null }>;
  /** Current sort mode */
  sort?: PlayerSortType;
}

function formatEarningsCompact(amount: number | null | undefined): string | null {
  if (amount == null || amount <= 0) return null;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

/* ─── All Tours Showcase Carousel ─── */
function AllToursShowcase({ players }: { players: ElitePlayer[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = players.length;

  const startAutoRotation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % count);
    }, 5000);
  }, [count]);

  const stopAutoRotation = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (!isPaused && count > 1) startAutoRotation();
    return () => stopAutoRotation();
  }, [isPaused, count, startAutoRotation, stopAutoRotation]);

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(((idx % count) + count) % count);
    // Pause then resume after 3s
    setIsPaused(true);
    stopAutoRotation();
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setIsPaused(false), 3000);
  }, [count, stopAutoRotation]);

  useEffect(() => {
    return () => { if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current); };
  }, []);

  const handlers = useSwipeable({
    onSwipedLeft: () => goTo(currentIndex + 1),
    onSwipedRight: () => goTo(currentIndex - 1),
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 30,
  });

  const player = players[currentIndex];
  if (!player) return null;

  const photoUrl = getPlayerHeadshotUrl(player.playerName, 'pga');
  const country = titleCaseCountry(player.country);

  return (
    <div className="relative">
      {/* Burger menu */}
      <button
        className="absolute z-20 flex items-center justify-center"
        style={{ top: '48px', left: '16px', width: '44px', height: '44px' }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
        aria-label="Open tour menu"
      >
        <Menu
          className="w-[22px] h-[22px]"
          strokeWidth={2}
          style={{ color: 'hsl(var(--foreground))', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' }}
        />
      </button>

      <div {...handlers}>
        <Link
          to={`/tourhub/player/${player.playerId}`}
          className="block active:scale-[0.995] transition-transform"
        >
          <div className="relative w-full overflow-hidden" style={{ height: '40dvh' }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={player.playerId}
                src={photoUrl}
                alt={player.playerName}
                className="absolute inset-0 w-full h-full object-cover object-[center_10%]"
                loading="eager"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
              />
            </AnimatePresence>

            {/* Gradient */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.05) 60%, transparent 80%)',
            }} />

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 space-y-1.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={player.playerId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-1"
                >
                  <h2
                    className="text-white"
                    style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.2 }}
                  >
                    {player.playerName}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <CountryFlag country={player.country} size="sm" className="brightness-110" />
                    {country && (
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                        {country}
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Carousel dots */}
              {count > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  {players.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i); }}
                      className="rounded-full transition-colors duration-200"
                      style={{
                        width: '7px',
                        height: '7px',
                        background: i === currentIndex ? 'hsl(var(--foreground))' : 'rgba(255,255,255,0.3)',
                      }}
                      aria-label={`Go to player ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/** Runner card — #2 amber, #3 silver */
function RunnerCard({ player, index, activeTour, statsMap, sort, tiedCount }: { 
  player: ElitePlayer; 
  index: number;
  activeTour: PlayerTourCode;
  statsMap?: Map<string, { earnings: number | null; wins: number | null; tourRank: number | null; points?: number | null; tournamentsPlayed?: number | null }>;
  sort?: PlayerSortType;
  tiedCount?: number;
}) {
  const tourCode = activeTour === 'all' ? 'pga' : activeTour;
  const photoUrl = getPlayerHeadshotUrl(player.playerName, tourCode);
  const stats = statsMap?.get(player.playerId);
  const tourRank = stats?.tourRank;
  const lastName = player.playerName.split(' ').slice(-1)[0];
  const country = titleCaseCountry(player.country);

  // Context-aware badge number
  let badgeNumber: number | string;
  if (sort === 'most-wins') {
    badgeNumber = stats?.wins || 0;
  } else if (sort === 'highest-earnings') {
    badgeNumber = index + 2; // position 2 or 3
  } else {
    badgeNumber = activeTour === 'all' ? player.worldRank : (tourRank || player.worldRank);
  }

  const rankBg = index === 0
    ? '#94A3B8'
    : '#C2875A';

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl active:scale-[0.97] transition-transform"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.5)',
        flex: '1 1 0%',
        minWidth: 0,
      }}
    >
      {/* Rank circle */}
      <div
        className="flex-shrink-0 rounded-full flex items-center justify-center"
        style={{ background: rankBg, width: '26px', height: '26px' }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{badgeNumber}</span>
      </div>

      {/* Avatar */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: '36px', height: '36px', borderRadius: '34%', border: '1px solid hsl(var(--border) / 0.4)' }}
      >
        <img
          src={photoUrl}
          alt={player.playerName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
        />
      </div>

      {/* Name & Country */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <p style={{ fontSize: '14px', fontWeight: 600 }} className="text-foreground truncate">{lastName}</p>
          {tiedCount != null && tiedCount > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 600 }} className="text-muted-foreground shrink-0">
              +{tiedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <CountryFlag country={player.country} size="sm" />
        </div>
      </div>
    </Link>
  );
}

export function PlayersHero({ players, activeTour, statsMap, sort = 'world-rank-desc' }: PlayersHeroProps) {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  
  if (players.length === 0) return null;

  // All Tours: render showcase carousel instead
  if (activeTour === 'all') {
    return <AllToursShowcase players={players} />;
  }

  const champion = players[0];
  const runners = players.slice(1, 5);
  const champTourCode = activeTour;
  const photoUrl = getPlayerHeadshotUrl(champion.playerName, champTourCode);
  const showPhoto = !imageError;
  const flag = countryCodeToFlag(champion.countryCode);
  const country = titleCaseCountry(champion.country);

  // Build meta line: context-aware based on sort mode
  const champStats = statsMap?.get(champion.playerId);
  const champTourRank = champStats?.tourRank;
  const isEuro = activeTour === 'EURO';
  const isLPGA = activeTour === 'LPGA';
  const isPGAD = activeTour === 'PGAD';
  const isLIV = activeTour === 'LIV';
  const isRankingsTour = isEuro || isLPGA || isPGAD || isLIV;
  const metaParts: string[] = [];
  
  const champWins = champStats?.wins ?? 0;
  const earningsStr = formatEarningsCompact(champStats?.earnings);

  if (sort === 'most-wins') {
    if (champWins > 0) metaParts.push(`${champWins} ${champWins === 1 ? 'win' : 'wins'}`);
  } else if (sort === 'highest-earnings') {
    if (earningsStr) metaParts.push(earningsStr);
    if (champWins > 0) metaParts.push(`${champWins} ${champWins === 1 ? 'win' : 'wins'}`);
  } else {
    if (isRankingsTour && champTourRank) {
      metaParts.push(`#${champTourRank}`);
      if (champStats?.points != null && champStats.points > 0) {
        metaParts.push(`${champStats.points.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts`);
      }
      if (champWins > 0) {
        metaParts.push(`${champWins} ${champWins === 1 ? 'win' : 'wins'}`);
      }
    } else {
      if (!champTourRank) {
        metaParts.push(`#${champion.worldRank} OWGR`);
      } else {
        metaParts.push(`#${champTourRank}`);
      }
      if (earningsStr) metaParts.push(earningsStr);
      if (champWins > 0) {
        metaParts.push(`${champWins} ${champWins === 1 ? 'win' : 'wins'}`);
      }
    }
  }

  // Calculate tied counts for most-wins sort
  const getPlayerWins = (p: ElitePlayer) => statsMap?.get(p.playerId)?.wins ?? 0;
  let tiedCounts: number[] = [];
  if (sort === 'most-wins' && runners.length >= 2) {
    tiedCounts = runners.slice(0, 2).map(runner => {
      const runnerWins = getPlayerWins(runner);
      const shownIds = new Set([champion.playerId, ...runners.slice(0, 2).map(r => r.playerId)]);
      const othersWithSameWins = players.filter(
        p => !shownIds.has(p.playerId) && getPlayerWins(p) === runnerWins
      ).length;
      return othersWithSameWins;
    });
  }

  return (
    <div className="relative">
      {/* Burger menu */}
      <button 
        className="absolute z-20 flex items-center justify-center"
        style={{
          top: '48px',
          left: '16px',
          width: '44px',
          height: '44px',
        }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
        aria-label="Open tour menu"
      >
        <Menu 
          className="w-[22px] h-[22px]" 
          strokeWidth={2}
          style={{ color: 'hsl(var(--foreground))', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' }}
        />
      </button>
      {/* Back arrow removed — replaced by "← Tour Overview" text link below hero */}
      <AnimatePresence mode="wait">
        <motion.div
          key={champion.playerId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to={`/tourhub/player/${champion.playerId}`}
            className="block active:scale-[0.995] transition-transform"
          >
            <div className="relative w-full overflow-hidden" style={{ height: '40dvh' }}>
              {showPhoto ? (
                <motion.img
                  src={photoUrl}
                  alt={champion.playerName}
                  className="absolute inset-0 w-full h-full object-cover object-[center_10%]"
                  loading="eager"
                  initial={{ scale: 1.06 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 12, ease: 'linear' }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-muted/80 to-muted" />
              )}

              {/* Strong bottom gradient for text legibility */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.05) 60%, transparent 80%)',
              }} />

              <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 space-y-1.5">
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-white"
                  style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}
                >
                  {champion.playerName}
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.4 }}
                  className="flex items-center gap-1.5"
                >
                  <CountryFlag country={champion.country} size="sm" className="brightness-110" />
                </motion.div>

                {metaParts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26, duration: 0.4 }}
                  >
                    <span 
                      className="inline-block text-white"
                      style={{ 
                        fontSize: '13px', fontWeight: 600, 
                        background: 'rgba(245,158,11,0.85)', 
                        borderRadius: '20px', 
                        padding: '5px 12px',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {metaParts.join(' · ')}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </Link>

          {/* Runner row — overlaps hero bottom */}
          {runners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              style={{ padding: '0 16px', marginTop: '-20px', position: 'relative', zIndex: 10, boxSizing: 'border-box', width: '100%' }}
            >
              <div className="flex gap-2" style={{ width: '100%' }}>
                {runners.slice(0, 2).map((player, index) => (
                  <RunnerCard
                    key={player.playerId}
                    player={player}
                    index={index}
                    activeTour={activeTour}
                    statsMap={statsMap}
                    sort={sort}
                    tiedCount={tiedCounts[index]}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
