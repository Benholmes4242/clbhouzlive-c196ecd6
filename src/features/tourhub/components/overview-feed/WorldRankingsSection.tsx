/**
 * WorldRankingsSection - Dark charcoal section showing top 5 world ranked players
 * Horizontal scrollable cards with rank number, initials, name, and country
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTopWorldRanked, toTitleCase, getInitials } from '../../hooks/useWorldRankings';

export function WorldRankingsSection() {
  const { data: topPlayers, isLoading } = useTopWorldRanked(10);

  if (isLoading) {
    return (
      <section className="bg-[#1a1a1a] -mx-4 sm:-mx-6 px-4 sm:px-6 py-6">
        <div className="animate-pulse">
          <div className="h-4 w-40 bg-white/10 rounded mb-4" />
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-shrink-0 w-[120px] h-[140px] bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (topPlayers.length === 0) return null;

  // Take top 5 for display
  const displayPlayers = topPlayers.slice(0, 5);

  return (
    <section className="bg-[#1a1a1a] -mx-4 sm:-mx-6 px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
          World Rankings
        </h3>
        <Link 
          to="/tourhub?tab=players"
          className="text-sm text-white/50 hover:text-white/80 flex items-center gap-1 transition-colors"
        >
          All Rankings <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      {/* Horizontal scroll of player cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {displayPlayers.map((player, index) => {
          const isFirst = index === 0;
          
          return (
            <Link
              key={player.playerId}
              to={`/tourhub/player/${player.playerId}`}
              className="flex-shrink-0 w-[120px] group"
            >
              <div 
                className={`
                  relative h-[140px] rounded-xl p-3 flex flex-col
                  bg-white/5 backdrop-blur-sm
                  transition-all group-hover:bg-white/10
                  ${isFirst ? 'ring-1 ring-amber-500/50' : ''}
                `}
              >
                {/* Rank number - top left, large */}
                <span 
                  className={`
                    text-2xl font-bold leading-none
                    ${isFirst ? 'text-amber-400' : 'text-white/40'}
                  `}
                >
                  {player.worldRank}
                </span>
                
                {/* Player initials circle - centered */}
                <div className="flex-1 flex items-center justify-center my-2">
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${isFirst 
                        ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/20 ring-1 ring-amber-500/30' 
                        : 'bg-white/10'
                      }
                    `}
                  >
                    {player.photoUrl ? (
                      <img 
                        src={player.photoUrl}
                        alt={player.playerName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className={`text-sm font-bold ${isFirst ? 'text-amber-300' : 'text-white/60'}`}>
                        {getInitials(player.playerName)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Player name */}
                <p className="text-white font-semibold text-xs leading-tight text-center truncate">
                  {player.playerName.split(' ').slice(-1)[0]}
                </p>
                
                {/* Country */}
                <p className="text-white/40 text-[10px] text-center truncate mt-0.5">
                  {toTitleCase(player.country) || 'Unknown'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
