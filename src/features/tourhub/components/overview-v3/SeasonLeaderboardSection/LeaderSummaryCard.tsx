/**
 * LeaderSummaryCard - Hero card with Leader Feature + Chasing Pack
 * 
 * Two-column layout:
 * - Left (60-65%): Season leader with large stat, avatar, rank badge
 * - Right (35-40%): #2 and #3 with delta from leader
 * - Bottom: Top-10 average micro-stat strip
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderEntry } from './types';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface LeaderSummaryCardProps {
  leader: LeaderEntry;
  chaser2: LeaderEntry | null;
  chaser3: LeaderEntry | null;
  unitLabel: string;
  topTenAverage: number;
}

/** Initials fallback avatar */
function InitialsAvatar({ initials, size }: { initials: string; size: 'lg' | 'sm' }) {
  const sizeClass = size === 'lg' ? 'w-[88px] h-[88px] text-2xl' : 'w-[44px] h-[44px] text-sm';
  return (
    <div className={`${sizeClass} rounded-full bg-[#F1F5F9] flex items-center justify-center`}>
      <span className="font-bold text-[#94A3B8]">{initials}</span>
    </div>
  );
}

/** Player avatar with fallback */
function PlayerAvatar({ 
  player, 
  size 
}: { 
  player: LeaderEntry; 
  size: 'lg' | 'sm';
}) {
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  const sizeClass = size === 'lg' ? 'w-[88px] h-[88px]' : 'w-[44px] h-[44px]';
  
  if (!photoUrl) {
    return <InitialsAvatar initials={player.initials} size={size} />;
  }
  
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-[#F1F5F9] border border-[rgba(0,0,0,0.06)] flex-shrink-0`}>
      <img
        src={photoUrl}
        alt={player.playerName}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<div class="w-full h-full bg-[#F1F5F9] flex items-center justify-center"><span class="font-bold text-[#94A3B8] ${size === 'lg' ? 'text-2xl' : 'text-sm'}">${player.initials}</span></div>`;
          }
        }}
      />
    </div>
  );
}

/** Format delta: always negative, one decimal */
function formatDelta(leaderValue: number, playerValue: number, unit: string): string {
  const delta = playerValue - leaderValue;
  const formatted = delta.toFixed(1);
  return `${formatted} ${unit}`.trim();
}

export const LeaderSummaryCard = memo(function LeaderSummaryCard({
  leader,
  chaser2,
  chaser3,
  unitLabel,
  topTenAverage,
}: LeaderSummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-2xl bg-white border border-[rgba(0,0,0,0.06)] overflow-hidden"
      style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}
    >
      {/* Two-column grid */}
      <div className="flex">
        {/* Left Column: Leader Feature (60-65%) */}
        <div className="flex-[0_0_60%] p-4 flex flex-col gap-3">
          {/* Avatar + Rank Badge */}
          <div className="flex items-start gap-3">
            <PlayerAvatar player={leader} size="lg" />
            <div className="flex flex-col gap-1">
              {/* Rank badge */}
              <div 
                className="w-7 h-7 rounded-full bg-[#F7F8FA] flex items-center justify-center"
                aria-label="Rank 1"
              >
                <span className="text-sm font-semibold text-[#0B1220]">#1</span>
              </div>
            </div>
          </div>
          
          {/* Name */}
          <h3 
            className="text-[20px] font-semibold text-[#0B1220] leading-tight line-clamp-2"
            title={leader.playerName}
          >
            {leader.playerName}
          </h3>
          
          {/* Big stat number + unit */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[32px] font-bold text-[#0B1220] tabular-nums leading-none">
              {leader.statDisplayValue}
            </span>
            <span className="text-[16px] font-normal text-[rgba(11,18,32,0.65)]">
              {unitLabel}
            </span>
          </div>
          
          {/* Sub-label */}
          <p className="text-[13px] text-[rgba(11,18,32,0.65)]">
            Season-Leading Average
          </p>
        </div>
        
        {/* Vertical divider */}
        <div className="w-px bg-[rgba(0,0,0,0.06)] self-stretch my-4" />
        
        {/* Right Column: Chasing Pack (35-40%) */}
        <div className="flex-[0_0_40%] p-4 flex flex-col">
          <h4 className="text-[14px] font-medium text-[rgba(11,18,32,0.65)] mb-3">
            Chasing Pack
          </h4>
          
          <div className="flex flex-col gap-2">
            {/* Chaser #2 */}
            {chaser2 && (
              <ChaserRow 
                player={chaser2} 
                leaderValue={leader.statValue} 
                unitLabel={unitLabel}
              />
            )}
            
            {/* Hairline divider */}
            {chaser2 && chaser3 && (
              <div className="h-px bg-[rgba(0,0,0,0.06)]" />
            )}
            
            {/* Chaser #3 */}
            {chaser3 && (
              <ChaserRow 
                player={chaser3} 
                leaderValue={leader.statValue} 
                unitLabel={unitLabel}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom: Top-10 Average Strip */}
      <div 
        className="h-[42px] px-4 flex items-center gap-2 border-t border-[rgba(0,0,0,0.06)]"
        style={{ background: 'rgba(0,0,0,0.015)' }}
      >
        <BarChart3 className="w-4 h-4 text-[rgba(11,18,32,0.45)]" />
        <span className="text-[13px] text-[rgba(11,18,32,0.65)]">
          Top 10 average:{' '}
          <span className="font-semibold text-[#0B1220]">
            {topTenAverage.toFixed(1)} {unitLabel}
          </span>
        </span>
      </div>
    </motion.div>
  );
});

/** Chaser mini-row in the Chasing Pack column */
const ChaserRow = memo(function ChaserRow({
  player,
  leaderValue,
  unitLabel,
}: {
  player: LeaderEntry;
  leaderValue: number;
  unitLabel: string;
}) {
  const delta = formatDelta(leaderValue, player.statValue, unitLabel);
  
  return (
    <div className="flex items-center gap-2 py-2" style={{ height: '64px' }}>
      <PlayerAvatar player={player} size="sm" />
      <div className="flex-1 min-w-0">
        <p 
          className="text-[15px] font-medium text-[#0B1220] truncate leading-tight line-clamp-2"
          title={player.playerName}
        >
          {player.playerName}
        </p>
        <p className="text-[13px] text-[rgba(11,18,32,0.45)] mt-0.5 tabular-nums">
          {delta}
        </p>
      </div>
    </div>
  );
});
