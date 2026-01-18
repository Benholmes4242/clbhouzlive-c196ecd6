/**
 * MyGolfLayer - Personalization widget
 * Shows followed players, tours, and events
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronDown, ChevronUp, User, Trophy, Calendar, X } from 'lucide-react';
import type { UserFollows, TourLens, RankedPlayer, GolfEvent } from '../types';
import { TOUR_LENS_CONFIG } from '../hooks/useTourLens';

interface MyGolfLayerProps {
  follows: UserFollows;
  players?: RankedPlayer[];
  events?: GolfEvent[];
  onRemovePlayer?: (playerId: string) => void;
  onRemoveTour?: (tour: TourLens) => void;
  onRemoveEvent?: (eventId: string) => void;
}

export const MyGolfLayer = memo(function MyGolfLayer({
  follows,
  players = [],
  events = [],
  onRemovePlayer,
  onRemoveTour,
  onRemoveEvent,
}: MyGolfLayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasFollows = follows.players.length > 0 || 
                     follows.tours.length > 0 || 
                     follows.events.length > 0;

  if (!hasFollows) return null;

  const followedPlayers = players.filter(p => follows.players.includes(p.id));
  const followedEvents = events.filter(e => follows.events.includes(e.id));
  const followedTourConfigs = TOUR_LENS_CONFIG.filter(t => follows.tours.includes(t.id));

  const totalFollows = follows.players.length + follows.tours.length + follows.events.length;

  return (
    <section className="mt-8">
      {/* Collapsed bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl hover:border-emerald-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Heart className="w-5 h-5 text-emerald-600" fill="currentColor" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900">My Golf</p>
            <p className="text-sm text-slate-500">
              {totalFollows} following
            </p>
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Followed Players */}
              {followedPlayers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Players</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {followedPlayers.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-medium">
                              {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-slate-700">{player.name}</span>
                        {onRemovePlayer && (
                          <button
                            onClick={() => onRemovePlayer(player.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Followed Tours */}
              {followedTourConfigs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Tours</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {followedTourConfigs.map(tour => (
                      <div
                        key={tour.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full"
                      >
                        <span className="text-sm text-slate-700">{tour.label}</span>
                        {onRemoveTour && (
                          <button
                            onClick={() => onRemoveTour(tour.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Followed Events */}
              {followedEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Events</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {followedEvents.map(event => (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full"
                      >
                        <span className="text-sm text-slate-700">{event.name}</span>
                        {onRemoveEvent && (
                          <button
                            onClick={() => onRemoveEvent(event.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
