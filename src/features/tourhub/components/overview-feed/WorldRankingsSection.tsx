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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
          // Get last name for display - allow up to 2 lines if needed
          const lastName = player.playerName.split(' ').slice(-1)[0];
          
          return (
            <Link
              key={player.playerId}
              to={`/tourhub/player/${player.playerId}`}
              className="flex-shrink-0 w-[140px] group"
            >
              <div 
                className={`
                  relative h-[150px] rounded-xl p-3.5 flex flex-col
                  bg-white shadow-sm border border-slate-100
                  transition-all group-hover:shadow-lg group-hover:border-slate-200
                  ${isFirst 
                    ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-50/50 to-white shadow-md' 
                    : ''
                  }
                `}
              >
                {/* Rank number - top left, larger and bolder */}
                <span 
                  className={`
                    text-3xl font-extrabold leading-none
                    ${isFirst ? 'text-amber-500' : 'text-slate-300'}
                  `}
                >
                  {player.worldRank}
                </span>
                
                {/* Player photo/initials circle - centered */}
                <div className="flex-1 flex items-center justify-center my-2">
                  <div 
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center overflow-hidden
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
                      <span className={`text-base font-bold ${isFirst ? 'text-amber-600' : 'text-slate-500'}`}>
                        {getInitials(player.playerName)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Player name - allow wrapping for long names */}
                <p className="text-foreground font-semibold text-sm leading-tight text-center line-clamp-2">
                  {lastName}
                </p>
                
                {/* Country */}
                <p className="text-muted-foreground text-[10px] text-center mt-0.5">
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
