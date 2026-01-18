/**
 * StorylinesRail - Horizontal rail of storyline cards
 * Expandable story cards with editorial content
 */

import { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, TrendingUp, Zap, FileText, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Storyline } from '../types';

interface StorylinesRailProps {
  storylines: Storyline[];
  onStoryClick?: (storyline: Storyline) => void;
}

const typeConfig = {
  breaking: { icon: Zap, color: 'bg-red-500', label: 'Breaking' },
  trending: { icon: TrendingUp, color: 'bg-amber-500', label: 'Trending' },
  insight: { icon: Newspaper, color: 'bg-blue-500', label: 'Insight' },
  recap: { icon: FileText, color: 'bg-emerald-500', label: 'Recap' },
};

function StoryCard({ 
  story, 
  onClick,
  isExpanded,
  onClose,
}: { 
  story: Storyline; 
  onClick: () => void;
  isExpanded: boolean;
  onClose: () => void;
}) {
  const config = typeConfig[story.type] || typeConfig.insight;
  const Icon = config.icon;

  return (
    <>
      {/* Collapsed card */}
      <motion.button
        onClick={onClick}
        className="shrink-0 w-[280px] bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-slate-300 hover:shadow-lg transition-all group"
        whileHover={{ y: -4 }}
      >
        {/* Type badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.color} mb-3`}>
          <Icon className="w-3 h-3 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">
            {config.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
          {story.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-slate-500 line-clamp-2">
          {story.summary}
        </p>

        {/* Image if available */}
        {story.imageUrl && (
          <div className="mt-3 h-24 rounded-lg overflow-hidden bg-slate-100">
            <img 
              src={story.imageUrl} 
              alt={story.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 uppercase tracking-wide">
            {story.tour === 'global' ? 'All Tours' : story.tour.toUpperCase()}
          </span>
          <span className="text-emerald-600 font-medium group-hover:underline">
            Read More →
          </span>
        </div>
      </motion.button>

      {/* Expanded overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              {story.imageUrl && (
                <div className="h-48 bg-slate-100">
                  <img 
                    src={story.imageUrl} 
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.color} mb-4`}>
                  <Icon className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                    {config.label}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3">{story.title}</h2>
                <p className="text-slate-600 leading-relaxed">{story.summary}</p>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-full hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export const StorylinesRail = memo(function StorylinesRail({
  storylines,
  onStoryClick,
}: StorylinesRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (storylines.length === 0) return null;

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Weekly Storylines</h2>
          <p className="text-sm text-slate-500 mt-0.5">What's happening in golf this week</p>
        </div>
        
        {/* Scroll controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll rail */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {storylines.map((story) => (
          <div key={story.id} style={{ scrollSnapAlign: 'start' }}>
            <StoryCard
              story={story}
              onClick={() => {
                setExpandedId(story.id);
                onStoryClick?.(story);
              }}
              isExpanded={expandedId === story.id}
              onClose={() => setExpandedId(null)}
            />
          </div>
        ))}
      </div>
    </section>
  );
});
