/**
 * GlobalPulse - Sticky mini strip at the top
 * Displays live events, next tee times, breaking updates
 * Height: ~44-52px, inline expand on tap, deep-link support
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { GlobalPulseItem } from '../types';

interface GlobalPulseProps {
  items: GlobalPulseItem[];
  onItemClick?: (item: GlobalPulseItem) => void;
}

const typeIcons = {
  live: Radio,
  'tee-time': Clock,
  breaking: Zap,
  result: Radio,
};

export function GlobalPulse({ items, onItemClick }: GlobalPulseProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  // Auto-rotate through items when collapsed
  useEffect(() => {
    if (items.length <= 1 || isExpanded) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length, isExpanded]);

  if (items.length === 0) return null;

  const activeItem = items[activeIndex] || items[0];
  const Icon = typeIcons[activeItem.type] || Radio;

  const handleItemTap = (item: GlobalPulseItem) => {
    if (item.deepLink) {
      navigate(item.deepLink);
    }
    onItemClick?.(item);
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      {/* Main pulse strip - full width on mobile */}
      <motion.div 
        className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10"
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 48 }}
      >
        {/* Collapsed view - single line ticker */}
        <div 
          className="h-12 flex items-center justify-between px-4 cursor-pointer"
          onClick={() => items.length > 1 ? setIsExpanded(!isExpanded) : handleItemTap(activeItem)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Status indicator */}
            <div className="flex items-center gap-2 shrink-0">
              {activeItem.type === 'live' ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Live</span>
                </div>
              ) : activeItem.type === 'breaking' ? (
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Breaking</span>
                </div>
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {activeItem.headline}
              </p>
            </div>

            {activeItem.subtext && (
              <span className="text-xs text-slate-400 shrink-0">
                {activeItem.subtext}
              </span>
            )}
          </div>

          {/* Expand indicator */}
          {items.length > 1 && (
            <div className="flex items-center gap-2 ml-3">
              <div className="flex gap-1">
                {items.slice(0, 4).map((_, i) => (
                  <div 
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === activeIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          )}
        </div>

        {/* Expanded view - all items */}
        <AnimatePresence>
          {isExpanded && items.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/5"
            >
              {items.map((item, i) => {
                const ItemIcon = typeIcons[item.type] || Radio;
                return (
                  <button
                    key={item.id}
                    className={`w-full h-11 flex items-center gap-3 px-4 hover:bg-white/5 transition-colors text-left ${
                      i === activeIndex ? 'bg-white/5' : ''
                    }`}
                    onClick={() => handleItemTap(item)}
                  >
                    {item.type === 'live' ? (
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    ) : item.type === 'breaking' ? (
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ItemIcon className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="text-sm text-white/90 truncate flex-1">{item.headline}</span>
                    {item.subtext && (
                      <span className="text-xs text-slate-500">{item.subtext}</span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
