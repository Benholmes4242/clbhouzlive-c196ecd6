/**
 * PlayersHero - Immersive full-bleed #1 player hero.
 * Aligned with Tour Overview audit typography & spacing.
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

/** Runner card — #2 amber, #3 silver */
function RunnerCard({ player, index }: { player: ElitePlayer; index: number }) {
  const pgaHeadshot = player.pgaTourId ? getPgaTourHeadshotUrl(player.pgaTourId) : null;
  const photoUrl = pgaHeadshot || resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const rank = player.worldRank;
  const isFirst = index === 0;
  const lastName = player.playerName.split(' ').slice(-1)[0];
  const country = titleCaseCountry(player.country);

  const rankBg = isFirst
    ? '#f59e0b'
    : '#94A3B8';

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl active:scale-[0.97] transition-transform"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.5)',
        flex: '1 1 0%',
      }}
    >
      {/* Rank circle */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: rankBg }}
      >
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{rank}</span>
      </div>

      {/* Avatar */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: '36px', height: '36px', borderRadius: '34%', border: '1px solid hsl(var(--border) / 0.4)' }}
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
        <p style={{ fontSize: '14px', fontWeight: 600 }} className="text-foreground truncate">{lastName}</p>
        <p style={{ fontSize: '11px', fontWeight: 400 }} className="text-muted-foreground truncate">{country || 'Unknown'}</p>
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

  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Back button */}
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
            <div className="relative w-full overflow-hidden" style={{ height: 'clamp(260px, 45vh, 380px)' }}>
              {photoUrl ? (
                <motion.img
                  src={photoUrl}
                  alt={champion.playerName}
                  className="absolute inset-0 w-full h-full object-cover object-[center_10%]"
                  loading="eager"
                  initial={{ scale: 1.06 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 12, ease: 'linear' }}
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-muted" />
              )}

              {/* Strong bottom gradient for text legibility */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 35%, transparent 70%)',
              }} />

              <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 space-y-1.5">
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-white"
                  style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}
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
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{country}</span>
                </motion.div>

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
                      padding: '6px 14px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {metaParts.join(' · ')}
                  </span>
                </motion.div>
              </div>
            </div>
          </Link>

          {/* Runner row — overlaps hero bottom */}
          {runners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="px-4"
              style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}
            >
              <div className="flex gap-2">
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
