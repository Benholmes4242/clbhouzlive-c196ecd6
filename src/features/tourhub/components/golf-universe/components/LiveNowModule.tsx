/**
 * LiveNowModule - Conditional module for live events
 * Compact tiles with leaderboard delta, top player, momentum indicator
 * 
 * WIRING: leaderboards prop is optional. When not available:
 * - Shows "Live scoring coming soon" instead of empty "updating..."
 * - Still renders live event tiles with available info
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Radio, TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GolfEvent, LeaderboardEntry } from '../types';

interface LiveNowModuleProps {
  events: GolfEvent[];
  leaderboards?: Map<string, LeaderboardEntry[]>;
  leaderboardsAvailable?: boolean;
}

export const LiveNowModule = memo(function LiveNowModule({ 
  events,
  leaderboards,
  leaderboardsAvailable = false,
}: LiveNowModuleProps) {
  const liveEvents = events.filter(e => e.isLive || e.status === 'inprogress');
  
  if (liveEvents.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <Radio className="w-5 h-5 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Live Now</h2>
        <span className="text-sm text-slate-500 ml-1">
          {liveEvents.length} event{liveEvents.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Live Event Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveEvents.map((event, index) => {
          const leaders = leaderboards?.get(event.id)?.slice(0, 3) || [];
          const hasLeaderboard = leaders.length > 0;
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/tourhub/tournament/${event.id}`}
                className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-lg transition-all group"
              >
                {/* Event header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                          Live
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 uppercase tracking-wide">
                        {event.tour.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {event.name}
                    </h3>
                  </div>
                </div>

                {/* Mini Leaderboard or Coming Soon state */}
                {hasLeaderboard ? (
                  <div className="space-y-2">
                    {leaders.map((leader, i) => (
                      <div 
                        key={leader.playerId}
                        className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 text-center text-xs font-semibold ${
                            i === 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}>
                            {leader.position}
                          </span>
                          <span className="text-sm font-medium text-slate-800">
                            {leader.playerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${
                            leader.score < 0 ? 'text-red-600' : 
                            leader.score === 0 ? 'text-slate-600' : 'text-slate-600'
                          }`}>
                            {leader.scoreDisplay}
                          </span>
                          {leader.movement === 'up' && (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          {leader.movement === 'down' && (
                            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                          )}
                          {leader.movement === 'same' && (
                            <Minus className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 flex items-center justify-center gap-2 text-sm text-slate-400 bg-slate-50 rounded-lg">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Live scoring coming soon</span>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{event.courseName || event.venueName}</span>
                  <span className="text-emerald-600 font-medium group-hover:underline">
                    {hasLeaderboard ? 'View Full Leaderboard →' : 'View Event →'}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
});
