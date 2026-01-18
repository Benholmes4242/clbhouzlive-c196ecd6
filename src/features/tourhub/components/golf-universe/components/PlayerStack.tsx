/**
 * PlayerStack - Dense view of top players
 * Inline accordion expansion, no page navigation
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trophy, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RankedPlayer } from '../types';

interface PlayerStackProps {
  players: RankedPlayer[];
  limit?: number;
  title?: string;
}

function PlayerRow({ 
  player, 
  isExpanded, 
  onToggle,
  index,
}: { 
  player: RankedPlayer; 
  isExpanded: boolean; 
  onToggle: () => void;
  index: number;
}) {
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-slate-100 last:border-0"
    >
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-3 px-1 hover:bg-slate-50/50 transition-colors"
      >
        {/* Rank */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          index === 0 ? 'bg-amber-400 text-amber-900' :
          index < 3 ? 'bg-slate-800 text-white' :
          'bg-slate-100 text-slate-600'
        }`}>
          {player.worldRank || '-'}
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
          {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-sm">
              {initials}
            </div>
          )}
        </div>

        {/* Name & Country */}
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-slate-900 truncate">{player.name}</p>
          <p className="text-xs text-slate-500 truncate">{player.country}</p>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4 text-sm">
          {player.wins !== null && player.wins > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Trophy className="w-3.5 h-3.5" />
              <span className="font-medium">{player.wins}</span>
            </div>
          )}
          {player.earnings !== null && (
            <span className="text-slate-500 tabular-nums">
              ${(player.earnings / 1000000).toFixed(1)}M
            </span>
          )}
        </div>

        {/* Expand icon */}
        <div className="text-slate-400">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <div className="bg-slate-50 rounded-xl p-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {player.eventsPlayed !== null && (
                    <StatBox label="Events" value={player.eventsPlayed} />
                  )}
                  {player.wins !== null && (
                    <StatBox label="Wins" value={player.wins} highlight={player.wins > 0} />
                  )}
                  {player.top10s !== null && (
                    <StatBox label="Top 10s" value={player.top10s} />
                  )}
                  {player.scoringAvg !== null && (
                    <StatBox label="Scoring Avg" value={player.scoringAvg.toFixed(2)} />
                  )}
                  {player.earnings !== null && (
                    <StatBox 
                      label="Earnings" 
                      value={`$${(player.earnings / 1000000).toFixed(2)}M`} 
                      highlight
                    />
                  )}
                  {player.fedexRank !== null && (
                    <StatBox label="FedEx Rank" value={`#${player.fedexRank}`} />
                  )}
                </div>

                {/* View profile link */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <Link
                    to={`/tourhub/player/${player.id}`}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    View Full Profile →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatBox({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string | number; 
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}

export const PlayerStack = memo(function PlayerStack({
  players,
  limit = 10,
  title = 'Top Players',
}: PlayerStackProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const displayPlayers = players.slice(0, limit);

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <Link 
          to="/tourhub?tab=players"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          View All →
        </Link>
      </div>

      {/* Player list card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {displayPlayers.map((player, i) => (
          <PlayerRow
            key={player.id}
            player={player}
            index={i}
            isExpanded={expandedId === player.id}
            onToggle={() => setExpandedId(
              expandedId === player.id ? null : player.id
            )}
          />
        ))}
      </div>
    </section>
  );
});
