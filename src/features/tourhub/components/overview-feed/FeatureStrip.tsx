/**
 * FeatureStrip - Horizontal swipe cards for Season Snapshot
 * Shows top players/leaders in priority order: World Rank, Scoring, Cuts, Events
 */

import { Link } from 'react-router-dom';
import { Trophy, Target, Scissors, Calendar } from 'lucide-react';
import type { SeasonLeader } from '../../hooks/useTourOverviewData';

interface FeatureCard {
  id: string;
  type: 'player';
  label: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  href: string;
  icon?: React.ReactNode;
  category: string;
}

interface FeatureStripProps {
  topPlayers?: SeasonLeader[];
  courseImages?: Map<string, { imageUrl: string | null; name: string }>;
}

// Category-specific gradients (premium feel)
const categoryGradients: Record<string, string> = {
  world_rank: 'from-amber-600 via-yellow-700 to-amber-800',
  scoring: 'from-emerald-700 to-teal-800',
  cuts: 'from-blue-700 to-indigo-800',
  events: 'from-slate-600 to-zinc-700',
};

// Category-specific icons
const categoryIcons: Record<string, React.ReactNode> = {
  world_rank: <Trophy className="w-3 h-3" />,
  scoring: <Target className="w-3 h-3" />,
  cuts: <Scissors className="w-3 h-3" />,
  events: <Calendar className="w-3 h-3" />,
};

export function FeatureStrip({ topPlayers = [] }: FeatureStripProps) {
  // Build cards from season leaders (already ordered: World Rank, Scoring, Cuts, Events)
  // Use index to ensure unique keys since same player may appear in multiple categories
  const cards: FeatureCard[] = topPlayers.slice(0, 4).map((leader, index) => {
    const labelMap: Record<string, string> = {
      world_rank: 'WORLD NO.1',
      scoring: 'LOWEST SCORING',
      cuts: 'MOST CUTS',
      events: 'MOST ACTIVE',
    };
    
    return {
      id: `card-${index}-${leader.category}`,
      type: 'player',
      label: labelMap[leader.category] || leader.label.toUpperCase(),
      title: leader.player.name,
      subtitle: leader.formattedValue,
      imageUrl: leader.player.photoUrl,
      href: `/tourhub/player/${leader.player.id}`,
      icon: categoryIcons[leader.category],
      category: leader.category,
    };
  });

  if (cards.length === 0) return null;

  return (
    <div className="-mx-4 sm:-mx-6">
      {/* Header - standardized */}
      <div className="px-4 sm:px-6 pb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Season Snapshot
        </h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
        {cards.map((card) => {
          const gradient = categoryGradients[card.category] || categoryGradients.events;
          
          return (
            <Link
              key={card.id}
              to={card.href}
              className="flex-shrink-0 w-[160px] group"
            >
              <div className="relative h-[100px] rounded-xl overflow-hidden">
                {/* Background - player photo or gradient */}
                {card.imageUrl ? (
                  <>
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                  </>
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                )}
                
                {/* Label pill */}
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wide">
                    {card.icon}
                    {card.label}
                  </span>
                </div>
                
                {/* Content */}
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white font-semibold text-sm leading-tight line-clamp-1 drop-shadow">
                    {card.title}
                  </p>
                  {card.subtitle && (
                    <p className="text-white/80 text-xs mt-0.5 font-medium">
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
