/**
 * PlayersHero - Immersive full-bleed #1 player hero.
 * Runner row matches WorldRankingsShowcase style (photo-first horizontal scroll).
 */

import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl, getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { ElitePlayer } from '../../hooks/useElitePlayers';
import type { PlayerTourCode } from './PlayersTourFilter';

interface PlayersHeroProps {
  players: ElitePlayer[];
  activeTour: PlayerTourCode;
  /** Stats map: playerId → { earnings, wins } */
  statsMap?: Map<string, { earnings: number | null; wins: number | null }>;
}

function formatEarningsCompact(amount: number | null | undefined): string | null {
  if (amount == null || amount <= 0) return null;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

/** Runner card — matches TourHubNavOverlay World Rankings row style */
function RunnerCard({ player, index }: { player: ElitePlayer; index: number }) {
  const pgaHeadshot = player.pgaTourId ? getPgaTourHeadshotUrl(player.pgaTourId) : null;
  const photoUrl = pgaHeadshot || resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const rank = player.worldRank;
  const isFirst = index === 0;
  const lastName = player.playerName.split(' ').slice(-1)[0];
  const country = titleCaseCountry(player.country);

  const rankColors = isFirst
    ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
    : index === 1
    ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
    : 'linear-gradient(135deg, #B45309 0%, #92400E 100%)';

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl active:scale-[0.97] transition-transform"
      style={{
        scrollSnapAlign: 'start',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.4)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)',
        flex: '1 1 0%',
      }}
    >
      {/* Rank Badge */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: rankColors, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' }}
      >
        <span className="text-xs font-bold text-white">{rank}</span>
      </div>

      {/* Avatar — squircle */}
      <div
        className="flex-shrink-0 overflow-hidden border border-border/50"
        style={{ width: '36px', height: '36px', borderRadius: '11px' }}
      >
        {photoUrl ? (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-muted" />
            <img
              src={photoUrl}
              alt={player.playerName}
              className="relative z-10 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      {/* Name & Country */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-foreground truncate">{lastName}</p>
        <p className="text-[10px] text-muted-foreground truncate">{country || 'Unknown'}</p>
      </div>
    </Link>
  );
}

export function PlayersHero({ players, activeTour, statsMap }: PlayersHeroProps) {
  if (players.length === 0) return null;

  const champion = players[0];
  const runners = players.slice(1, 5);
  const photoUrl = resolvePhotoUrl(champion.photoUrl, champion.pgaTourId, 'hero');
  const flag = countryCodeToFlag(champion.countryCode);
  const country = titleCaseCountry(champion.country);

  // Build meta line: #1 OWGR · $X.XM · X wins
  const champStats = statsMap?.get(champion.playerId);
  const metaParts: string[] = [];
  metaParts.push(`#${champion.worldRank} OWGR`);
  const earningsStr = formatEarningsCompact(champStats?.earnings);
  if (earningsStr) metaParts.push(earningsStr);
  if (champStats?.wins && champStats.wins > 0) {
    metaParts.push(`${champStats.wins} ${champStats.wins === 1 ? 'win' : 'wins'}`);
  }

  // 10% taller hero: clamp(282px, 53vh, 422px)
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Glass back button - matches CourseDetailPage */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute z-30 left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all"
        style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>
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
            {/* Straight-edge hero (no rounded corners) */}
            <div className="relative w-full overflow-hidden" style={{ height: 'clamp(282px, 53vh, 422px)' }}>
              {photoUrl ? (
                <motion.img
                  src={photoUrl}
                  alt={champion.playerName}
                  className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
                  loading="eager"
                  initial={{ scale: 1.06 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 12, ease: 'linear' }}
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-muted" />
              )}

              {/* Subtle gradient for text legibility */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
              }} />

              <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 space-y-1.5">
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-3xl font-bold text-white leading-tight"
                >
                  {champion.playerName}
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.4 }}
                  className="flex items-center gap-1.5"
                >
                  {flag && <span className="text-lg">{flag}</span>}
                  <span className="text-sm text-white/80">{country}</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26, duration: 0.4 }}
                >
                  <span className="inline-block px-3 py-1 rounded-md bg-black/20 backdrop-blur-sm text-sm font-medium text-amber-400">
                    {metaParts.join(' · ')}
                  </span>
                </motion.div>
              </div>
            </div>
          </Link>

          {/* Runner row — overlaps the hero by ~20% */}
          {runners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="px-4"
              style={{ marginTop: '-8px', position: 'relative', zIndex: 10 }}
            >
              <div className="flex gap-2.5">
                {runners.slice(0, 2).map((player, index) => (
                  <RunnerCard key={player.playerId} player={player} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
