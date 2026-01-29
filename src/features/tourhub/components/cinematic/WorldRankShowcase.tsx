/**
 * WorldRankShowcase - Premium horizontal showcase of top 10 world-ranked players
 * Apple-style cards with hover effects and podium treatment
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankings } from '../../hooks/useWorldRankings';
import { getPlayerImage } from '../../utils/placeholders';

interface WorldRankCardProps {
  player: {
    playerId: string;
    playerName: string;
    country: string | null;
    countryCode: string | null;
    photoUrl: string | null;
    worldRank: number | null;
    earnings: number | null;
  };
  rank: number;
}

function WorldRankCard({ player, rank }: WorldRankCardProps) {
  const nameParts = player.playerName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const photoUrl = player.photoUrl || getPlayerImage({ id: player.playerId });
  
  // Format earnings
  const formattedEarnings = player.earnings 
    ? `$${(player.earnings / 1000000).toFixed(1)}M`
    : null;

  return (
    <Link to={`/tourhub/player/${player.playerId}`}>
      <motion.div 
        className="relative w-[180px] h-[260px] rounded-3xl overflow-hidden flex-shrink-0 group cursor-pointer"
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Player Image */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900">
          <img
            src={photoUrl}
            alt={player.playerName}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Rank Badge */}
        <div className={cn(
          "absolute top-3 left-3 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
          rank === 1 && "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30",
          rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-500",
          rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/20",
          rank > 3 && "bg-white/10 backdrop-blur-sm border border-white/20"
        )}>
          {rank === 1 ? (
            <Trophy className="h-5 w-5 text-white" />
          ) : (
            <span className={cn(
              "font-bold",
              rank <= 3 ? "text-white text-lg" : "text-white/90 text-base"
            )}>
              {rank}
            </span>
          )}
        </div>
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-sm leading-tight">
            {firstName}
          </h3>
          <h3 className="text-white font-bold text-base leading-tight">
            {lastName}
          </h3>
          
          {player.country && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-white/60 text-xs truncate">{player.country}</span>
            </div>
          )}
          
          {formattedEarnings && (
            <div className="mt-2">
              <span className="text-white/50 text-xs">Season: </span>
              <span className="text-white font-medium text-sm">{formattedEarnings}</span>
            </div>
          )}
        </div>
        
        {/* Hover Glow for #1 */}
        {rank === 1 && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent" />
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export function WorldRankShowcase() {
  const { rankedOnly, isLoading } = useWorldRankings();
  
  const top10 = rankedOnly.slice(0, 10);
  
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="px-4 mb-4">
          <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-[180px] h-[260px] bg-white/5 rounded-3xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }
  
  if (top10.length === 0) {
    return null;
  }

  return (
    <section className="py-8" style={{ background: 'var(--th-bg-canvas, #000)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-5">
        <div>
          <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-1">
            Official World Golf Ranking
          </h2>
          <p className="text-white text-lg font-semibold">Top 10 in the World</p>
        </div>
        <Link 
          to="/tourhub?tab=rankings"
          className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      {/* Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2">
          {top10.map((player, idx) => (
            <WorldRankCard 
              key={player.playerId} 
              player={player} 
              rank={idx + 1} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
