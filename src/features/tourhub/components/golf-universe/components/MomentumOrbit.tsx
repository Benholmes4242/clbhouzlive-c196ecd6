/**
 * MomentumOrbit - World Rankings visualization
 * Replaces static ranking lists with orbital UI
 * Shows momentum arrows and stability glow
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RankedPlayer } from '../types';

interface MomentumOrbitProps {
  players: RankedPlayer[];
  limit?: number;
  onPlayerClick?: (player: RankedPlayer) => void;
}

// Orbital position calculator
function getOrbitPosition(index: number, total: number, radius: number = 120) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

// Avatar component with momentum glow
function PlayerOrbit({ 
  player, 
  position, 
  size = 48,
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
    rising: 'shadow-emerald-400/50',
    falling: 'shadow-red-400/50',
    stable: 'shadow-blue-400/30',
  };

  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <motion.button
      className="absolute flex items-center justify-center cursor-pointer"
      style={{
        width: size,
        height: size,
        left: `calc(50% + ${position.x}px - ${size/2}px)`,
        top: `calc(50% + ${position.y}px - ${size/2}px)`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.15, zIndex: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
    >
      <div 
        className={`relative w-full h-full rounded-full bg-white border-2 ${
          isCenter ? 'border-amber-400' : 'border-slate-200'
        } shadow-lg ${glowColors[player.momentum]} overflow-hidden`}
      >
        {player.photoUrl ? (
          <img 
            src={player.photoUrl} 
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-600 font-semibold text-sm">
            {initials}
          </div>
        )}
        
        {/* Rank badge */}
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
          isCenter ? 'bg-amber-400 text-amber-900' : 'bg-slate-800 text-white'
        }`}>
          {player.worldRank}
        </div>
      </div>

      {/* Momentum indicator */}
      {player.momentum !== 'stable' && (
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
          player.momentum === 'rising' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {player.momentum === 'rising' ? (
            <TrendingUp className="w-2.5 h-2.5 text-white" />
          ) : (
            <TrendingDown className="w-2.5 h-2.5 text-white" />
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
  const orbitPlayers = displayPlayers.slice(1, 10);

  return (
    <section className="mt-12 mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">World Rankings</h2>
          <p className="text-sm text-slate-500 mt-1">Momentum Orbit • Official World Golf Ranking</p>
        </div>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Full Rankings
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Orbit Visualization */}
      <div className="relative h-[320px] flex items-center justify-center">
        {/* Orbit rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[240px] h-[240px] rounded-full border border-slate-100" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-slate-50" />
        </div>

        {/* Center - World No.1 */}
        {worldNo1 && (
          <PlayerOrbit
            player={worldNo1}
            position={{ x: 0, y: 0 }}
            size={72}
            isCenter
            onClick={() => {
              setExpandedPlayer(worldNo1);
              onPlayerClick?.(worldNo1);
            }}
          />
        )}

        {/* Orbital players */}
        {orbitPlayers.map((player, i) => {
          const pos = getOrbitPosition(i, orbitPlayers.length, 110);
          return (
            <PlayerOrbit
              key={player.id}
              player={player}
              position={pos}
              size={44}
              onClick={() => {
                setExpandedPlayer(player);
                onPlayerClick?.(player);
              }}
            />
          );
        })}
      </div>

      {/* Expanded player card */}
      <AnimatePresence>
        {expandedPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0">
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
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-amber-600">
                      #{expandedPlayer.worldRank}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{expandedPlayer.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500">{expandedPlayer.country}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    {expandedPlayer.wins !== null && expandedPlayer.wins > 0 && (
                      <div>
                        <span className="text-slate-500">Wins:</span>
                        <span className="ml-1 font-semibold text-slate-800">{expandedPlayer.wins}</span>
                      </div>
                    )}
                    {expandedPlayer.top10s !== null && (
                      <div>
                        <span className="text-slate-500">Top 10s:</span>
                        <span className="ml-1 font-semibold text-slate-800">{expandedPlayer.top10s}</span>
                      </div>
                    )}
                    {expandedPlayer.earnings !== null && (
                      <div>
                        <span className="text-slate-500">Earnings:</span>
                        <span className="ml-1 font-semibold text-emerald-600">
                          ${(expandedPlayer.earnings / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setExpandedPlayer(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link
                  to={`/tourhub/player/${expandedPlayer.id}`}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  View Full Profile →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Rising</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span>Stable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Falling</span>
        </div>
      </div>
    </section>
  );
});
