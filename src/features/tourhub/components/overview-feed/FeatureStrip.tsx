/**
 * FeatureStrip - "Season Headlines" horizontal swipe cards
 * Renamed from Season Snapshot, taller cards with full-bleed images
 * Soft horizontal snap scroll with auto-peek hint
 */

import { Link } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { Trophy, Target, Scissors, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
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

// Category-specific gradient tints
const categoryGradients: Record<string, string> = {
  world_rank: 'from-amber-700/90 via-yellow-800/70 to-amber-900/80',
  scoring: 'from-emerald-700/90 via-teal-800/70 to-emerald-900/80',
  cuts: 'from-blue-700/90 via-indigo-800/70 to-blue-900/80',
  events: 'from-slate-700/90 via-zinc-800/70 to-slate-900/80',
};

// Category-specific icons
const categoryIcons: Record<string, React.ReactNode> = {
  world_rank: <Trophy className="w-3 h-3" />,
  scoring: <Target className="w-3 h-3" />,
  cuts: <Scissors className="w-3 h-3" />,
  events: <Calendar className="w-3 h-3" />,
};

export function FeatureStrip({ topPlayers = [] }: FeatureStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-peek animation: slight scroll to hint more content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Small delay then peek scroll
    const timeout = setTimeout(() => {
      el.scrollTo({ left: 16, behavior: 'smooth' });
      setTimeout(() => {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }, 400);
    }, 800);
    
    return () => clearTimeout(timeout);
  }, []);

  // Build cards from season leaders
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
      {/* Header - matching Schedule page section headers */}
      <div className="px-4 sm:px-6 pb-6">
        <h3 
          className="font-extrabold text-slate-800 uppercase"
          style={{ fontSize: '13px', letterSpacing: '0.08em' }}
        >
          Season Headlines
        </h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        {cards.map((card, index) => {
          const gradient = categoryGradients[card.category] || categoryGradients.events;
          
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileTap={{ scale: 0.98, y: -2 }}
              className="flex-shrink-0 snap-start"
            >
              <Link
                to={card.href}
                className="block w-[170px] group"
              >
                {/* Taller card - improved aspect ratio */}
                <div className="relative h-[180px] rounded-xl overflow-hidden shadow-md">
                  {/* Background - player photo or gradient */}
                  {card.imageUrl ? (
                    <>
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Soft category-tinted gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${gradient} opacity-60`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  )}
                  
                  {/* Category badge top-left */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-white text-[10px] font-semibold tracking-wider border border-white/10">
                      {card.icon}
                      {card.label}
                    </span>
                  </div>
                  
                  {/* Content - bottom */}
                  <div className="absolute bottom-3 left-3 right-3">
                    {/* Large stat value */}
                    {card.subtitle && (
                      <p className="text-2xl font-bold text-white drop-shadow-lg mb-1">
                        {card.subtitle}
                      </p>
                    )}
                    {/* Player name - secondary */}
                    <p className="text-white/90 font-medium text-sm leading-tight line-clamp-1 drop-shadow">
                      {card.title}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
