/**
 * PodiumSection - Compact Horizontal Podium Layout
 * 
 * Features:
 * - 2nd-1st-3rd horizontal arrangement
 * - Gold/Silver/Bronze gradient card backgrounds
 * - Rank badges at top of cards
 * - Clean stat display without skill bars
 * - Entry animation on category change
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import type { LeaderboardPlayer, CategoryId } from './types';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface PodiumSectionProps {
  players: LeaderboardPlayer[];
  categoryId?: CategoryId;
}

interface PodiumCardProps {
  player: LeaderboardPlayer;
  rank: 1 | 2 | 3;
  delay: number;
}

function truncateName(name: string, maxLength: number = 10): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + '…';
}

const PodiumCard = memo(function PodiumCard({ player, rank, delay }: PodiumCardProps) {
  const navigate = useNavigate();
  const isFirst = rank === 1;
  
  // Card sizes based on rank
  const cardWidth = isFirst ? 120 : 100;
  const cardHeight = isFirst ? 160 : 140;
  const avatarSize = isFirst ? 64 : 52;
  
  // Gradient backgrounds based on rank
  const getCardBackground = () => {
    switch (rank) {
      case 1:
        return 'linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, white 100%)';
      case 2:
        return 'linear-gradient(180deg, rgba(192, 192, 192, 0.08) 0%, white 100%)';
      case 3:
        return 'linear-gradient(180deg, rgba(205, 127, 50, 0.08) 0%, white 100%)';
      default:
        return 'white';
    }
  };
  
  const getCardBorderColor = () => {
    switch (rank) {
      case 1:
        return 'rgba(255, 215, 0, 0.3)';
      case 2:
        return 'rgba(192, 192, 192, 0.3)';
      case 3:
        return 'rgba(205, 127, 50, 0.3)';
      default:
        return 'rgba(0, 0, 0, 0.06)';
    }
  };
  
  const getBadgeStyle = () => {
    switch (rank) {
      case 1:
        return { background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: 'white' };
      case 2:
        return { background: 'linear-gradient(135deg, #E8E8E8 0%, #B8B8B8 100%)', color: '#666' };
      case 3:
        return { background: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)', color: 'white' };
      default:
        return { background: '#e2e8f0', color: '#64748b' };
    }
  };

  // Resolve player photo
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  
  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="flex flex-col items-center rounded-2xl border transition-colors"
      style={{
        width: cardWidth,
        height: cardHeight,
        padding: '16px 12px',
        background: getCardBackground(),
        borderColor: getCardBorderColor(),
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      transition={{ 
        delay,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      aria-label={`Rank ${rank}: ${player.playerName}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Rank Badge */}
      <div 
        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[13px] font-bold mb-3"
        style={getBadgeStyle()}
      >
        {rank === 1 && <Trophy className="w-3 h-3" />}
        #{rank}
      </div>
      
      {/* Avatar - Squircle shape */}
      <div 
        className="overflow-hidden bg-slate-100 mb-2.5 flex-shrink-0"
        style={{
          width: avatarSize,
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initials');
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="fallback-initials w-full h-full bg-slate-200 flex items-center justify-center"
          style={{ display: photoUrl ? 'none' : 'flex' }}
        >
          <span className="text-sm font-bold text-slate-400">{player.initials}</span>
        </div>
      </div>
      
      {/* Player Name */}
      <p 
        className="text-[14px] font-semibold text-slate-900 text-center truncate mb-1"
        style={{ maxWidth: cardWidth - 24 }}
        title={player.playerName}
      >
        {truncateName(player.playerName)}
      </p>
      
      {/* Stat Value */}
      <div className="flex items-baseline gap-0.5">
        <span className="text-[18px] font-bold text-blue-600">
          {player.statDisplayValue}
        </span>
        {player.statUnit && (
          <span className="text-[13px] font-medium text-slate-500/80">
            {player.statUnit}
          </span>
        )}
      </div>
    </motion.button>
  );
});

export const PodiumSection = memo(function PodiumSection({ players, categoryId }: PodiumSectionProps) {
  if (players.length < 3) return null;

  const [first, second, third] = players;

  return (
    <div 
      className="flex items-end justify-center gap-2 py-5"
      role="list"
      aria-label={`Top 3 players in ${categoryId || 'this category'}`}
    >
      {/* 2nd Place - Left */}
      <PodiumCard player={second} rank={2} delay={0.05} />
      
      {/* 1st Place - Center (elevated) */}
      <PodiumCard player={first} rank={1} delay={0.1} />
      
      {/* 3rd Place - Right */}
      <PodiumCard player={third} rank={3} delay={0.15} />
    </div>
  );
});
