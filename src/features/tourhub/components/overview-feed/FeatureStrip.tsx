/**
 * FeatureStrip - Horizontal swipe cards with images
 * Shows next up, top players, featured courses, etc.
 */

import { Link } from 'react-router-dom';
import { Calendar, TrendingUp, MapPin, Globe, History } from 'lucide-react';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { SeasonLeader, HistoryMoment } from '../../hooks/useTourOverviewData';

interface FeatureCard {
  id: string;
  type: 'tournament' | 'player' | 'course' | 'history';
  label: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  href: string;
  icon?: React.ReactNode;
}

interface FeatureStripProps {
  nextTournament?: TourTournament | null;
  topPlayers?: SeasonLeader[];
  historyMoments?: HistoryMoment[];
  courseImages?: Map<string, { imageUrl: string | null; name: string }>;
}

// Gradient fallbacks for cards without images
const cardGradients = [
  'from-emerald-700 to-teal-800',
  'from-blue-700 to-indigo-800',
  'from-amber-700 to-orange-800',
  'from-purple-700 to-pink-800',
  'from-slate-700 to-zinc-800',
];

export function FeatureStrip({ nextTournament, topPlayers = [], historyMoments = [], courseImages }: FeatureStripProps) {
  const cards: FeatureCard[] = [];

  // Add next tournament
  if (nextTournament) {
    const image = courseImages?.get(nextTournament.venue_name || '');
    cards.push({
      id: `next-${nextTournament.id}`,
      type: 'tournament',
      label: 'Next Up',
      title: nextTournament.name,
      subtitle: nextTournament.venue_city || undefined,
      imageUrl: image?.imageUrl,
      href: `/tourhub/tournament/${nextTournament.id}`,
      icon: <Calendar className="w-3 h-3" />,
    });
  }

  // Add top players (season leaders)
  topPlayers.slice(0, 3).forEach((leader, idx) => {
    const labels = ['Most Active', 'Lowest Scoring', 'World No.1'];
    cards.push({
      id: `player-${leader.player.id}`,
      type: 'player',
      label: labels[idx] || leader.label,
      title: leader.player.name,
      subtitle: leader.formattedValue,
      imageUrl: null, // Player images to be added
      href: `/tourhub/player/${leader.player.id}`,
      icon: idx === 0 ? <TrendingUp className="w-3 h-3" /> : <Globe className="w-3 h-3" />,
    });
  });

  // Add history moment
  if (historyMoments.length > 0) {
    const moment = historyMoments[0];
    cards.push({
      id: `history-${moment.year}`,
      type: 'history',
      label: `${moment.year}`,
      title: moment.title,
      subtitle: moment.description,
      imageUrl: null,
      href: '#',
      icon: <History className="w-3 h-3" />,
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="-mx-4 sm:-mx-6">
      <div className="px-4 sm:px-6 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Quick Look
        </h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
        {cards.map((card, idx) => {
          const gradientIdx = idx % cardGradients.length;
          
          return (
            <Link
              key={card.id}
              to={card.href}
              className="flex-shrink-0 w-[160px] group"
            >
              <div className="relative h-[100px] rounded-xl overflow-hidden">
                {/* Background */}
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${cardGradients[gradientIdx]}`} />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Label pill */}
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium">
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
                    <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
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
