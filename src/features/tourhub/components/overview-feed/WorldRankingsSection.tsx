/**
 * WorldRankingsSection - Slate section showing top 5 world ranked players
 * Horizontal scrollable cards with rank number, photo, full name, and country
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTopWorldRanked, toTitleCase, getInitials } from '../../hooks/useWorldRankings';

export function WorldRankingsSection() {
  const { data: topPlayers, isLoading } = useTopWorldRanked(10);

  if (isLoading) {
    return (
      <section className="bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6">
        <div className="animate-pulse">
          <div className="h-4 w-40 bg-slate-200 rounded mb-6" />
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-shrink-0 w-[140px] h-[150px] bg-slate-100 rounded-xl" />
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
    <section className="bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6">
      {/* Header - standardized */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground tracking-wide">
          World Rankings
        </h3>
        <Link 
          to="/tourhub?tab=players"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          All Rankings <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      {/* Horizontal scroll of player cards - wider cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {displayPlayers.map((player, index) => {
          const isFirst = index === 0;
          
          return (
            <Link
              key={player.playerId}
              to={`/tourhub/player/${player.playerId}`}
              className="flex-shrink-0 w-[140px] group"
            >
              <div 
                className={`
                  h-[175px] rounded-xl p-3.5 flex flex-col
                  bg-white shadow-sm border border-slate-100
                  transition-all group-hover:shadow-lg group-hover:border-slate-200
                  ${isFirst 
                    ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-50/50 to-white shadow-md' 
                    : ''
                  }
                `}
              >
                {/* Rank number - top left */}
                <span 
                  className={`
                    text-2xl font-extrabold leading-none flex-shrink-0
                    ${isFirst ? 'text-amber-500' : 'text-slate-300'}
                  `}
                >
                  {player.worldRank}
                </span>
                
                {/* Avatar - centered, fixed size */}
                <div className="flex-shrink-0 flex justify-center mt-2">
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center overflow-hidden
                      ${isFirst 
                        ? 'bg-gradient-to-br from-amber-100 to-amber-200 ring-2 ring-amber-400' 
                        : 'bg-slate-100'
                      }
                    `}
                  >
                    {player.photoUrl ? (
                      <img 
                        src={player.photoUrl}
                        alt={player.playerName}
                        className="w-full h-full rounded-full object-cover object-top"
                      />
                    ) : (
                      <span className={`text-sm font-bold ${isFirst ? 'text-amber-600' : 'text-slate-500'}`}>
                        {getInitials(player.playerName)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name area - fixed height for 2 lines */}
                <div className="flex-shrink-0 h-[36px] flex items-start justify-center mt-2">
                  <p className="text-sm font-medium text-foreground text-center leading-tight line-clamp-2">
                    {player.playerName}
                  </p>
                </div>

                {/* Country - pinned to bottom */}
                <p className="flex-shrink-0 text-[10px] text-muted-foreground text-center mt-auto">
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
