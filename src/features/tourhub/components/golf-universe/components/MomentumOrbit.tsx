/**
 * MomentumOrbit - World Rankings visualization
 * Replaces static ranking lists with orbital UI
 * 
 * Refinements:
 * - Responsive design (no clipping on mobile)
 * - Momentum derived from available stats
 * - Consistent expand behavior
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RankedPlayer } from '../types';

interface MomentumOrbitProps {
  players: RankedPlayer[];
  limit?: number;
  onPlayerClick?: (player: RankedPlayer) => void;
}

// Avatar with momentum glow - responsive sizing
function PlayerNode({ 
  player, 
  position, 
  size = 44,
  onClick,
  isCenter = false,
}: { 
  player: RankedPlayer;
  position: { x: number; y: number };
  size?: number;
  onClick?: () => void;
  isCenter?: boolean;
}) {
  const glowColors = {
    rising: 'ring-emerald-400/50 shadow-emerald-400/30',
    falling: 'ring-red-400/50 shadow-red-400/30',
    stable: 'ring-blue-400/30 shadow-blue-400/20',
  };

  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <motion.button
      className="absolute flex items-center justify-center"
      style={{
        width: size,
        height: size,
        left: `calc(50% + ${position.x}px - ${size/2}px)`,
        top: `calc(50% + ${position.y}px - ${size/2}px)`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, zIndex: 20 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      <div 
        className={`relative w-full h-full rounded-full bg-white border-2 ${
          isCenter ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200'
        } shadow-lg ${glowColors[player.momentum]} overflow-hidden`}
      >
        {player.photoUrl ? (
          <img 
            src={player.photoUrl} 
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-600 font-semibold text-xs">
            {initials}
          </div>
        )}
        
        {/* Rank badge */}
        <div className={`absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold ${
          isCenter ? 'bg-amber-400 text-amber-900' : 'bg-slate-800 text-white'
        }`}>
          {player.worldRank}
        </div>
      </div>

      {/* Momentum indicator - only show for rising/falling */}
      {player.momentum !== 'stable' && (
        <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
          player.momentum === 'rising' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {player.momentum === 'rising' ? (
            <TrendingUp className="w-2 h-2 text-white" />
          ) : (
            <TrendingDown className="w-2 h-2 text-white" />
          )}
        </div>
      )}
    </motion.button>
  );
}

export const MomentumOrbit = memo(function MomentumOrbit({
  players,
  limit = 10,
  onPlayerClick,
}: MomentumOrbitProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<RankedPlayer | null>(null);
  const displayPlayers = players.slice(0, limit);
  const worldNo1 = displayPlayers[0];
  const orbitPlayers = displayPlayers.slice(1, 9); // Max 8 in orbit

  // Responsive orbit radius
  const orbitRadius = typeof window !== 'undefined' && window.innerWidth < 400 ? 85 : 100;
  const centerSize = typeof window !== 'undefined' && window.innerWidth < 400 ? 56 : 64;
  const nodeSize = typeof window !== 'undefined' && window.innerWidth < 400 ? 38 : 42;

  // Calculate orbital positions
  const getOrbitPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.cos(angle) * orbitRadius,
      y: Math.sin(angle) * orbitRadius,
    };
  };

  return (
    <section className="mt-8">
      {/* Section Header - tighter */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">World Rankings</h2>
          <p className="text-xs text-slate-500">Momentum Orbit</p>
        </div>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          Full Rankings
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Orbit Visualization - responsive height */}
      <div className="relative h-[260px] sm:h-[280px] flex items-center justify-center overflow-hidden">
        {/* Orbit rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="rounded-full border border-slate-100" 
            style={{ width: orbitRadius * 2 + nodeSize, height: orbitRadius * 2 + nodeSize }}
          />
          <div 
            className="absolute rounded-full border border-slate-50" 
            style={{ width: orbitRadius * 1.4, height: orbitRadius * 1.4 }}
          />
        </div>

        {/* Center - World No.1 */}
        {worldNo1 && (
          <PlayerNode
            player={worldNo1}
            position={{ x: 0, y: 0 }}
            size={centerSize}
            isCenter
            onClick={() => {
              setExpandedPlayer(worldNo1);
              onPlayerClick?.(worldNo1);
            }}
          />
        )}

        {/* Orbital players */}
        {orbitPlayers.map((player, i) => {
          const pos = getOrbitPosition(i, orbitPlayers.length);
          return (
            <PlayerNode
              key={player.id}
              player={player}
              position={pos}
              size={nodeSize}
              onClick={() => {
                setExpandedPlayer(player);
                onPlayerClick?.(player);
              }}
            />
          );
        })}
      </div>

      {/* Expanded player card - fixed position to avoid layout jump */}
      <AnimatePresence>
        {expandedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
            onClick={() => setExpandedPlayer(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    {expandedPlayer.photoUrl ? (
                      <img 
                        src={expandedPlayer.photoUrl}
                        alt={expandedPlayer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                        {expandedPlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-bold ${
                        expandedPlayer.worldRank === 1 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        #{expandedPlayer.worldRank}
                      </span>
                      {expandedPlayer.momentum !== 'stable' && (
                        <span className={`text-xs ${
                          expandedPlayer.momentum === 'rising' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {expandedPlayer.momentum === 'rising' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 truncate">{expandedPlayer.name}</h3>
                    <p className="text-sm text-slate-500">{expandedPlayer.country}</p>
                  </div>

                  <button 
                    onClick={() => setExpandedPlayer(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats grid - compact */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {expandedPlayer.wins !== null && expandedPlayer.wins > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{expandedPlayer.wins}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Wins</p>
                    </div>
                  )}
                  {expandedPlayer.top10s !== null && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">{expandedPlayer.top10s}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Top 10s</p>
                    </div>
                  )}
                  {expandedPlayer.earnings !== null && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">
                        ${(expandedPlayer.earnings / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">Earnings</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    to={`/tourhub/player/${expandedPlayer.id}`}
                    className="block w-full py-2.5 text-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    onClick={() => setExpandedPlayer(null)}
                  >
                    View Full Profile →
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend - compact */}
      <div className="mt-4 flex items-center justify-center gap-5 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Rising</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span>Stable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Falling</span>
        </div>
      </div>
    </section>
  );
});
