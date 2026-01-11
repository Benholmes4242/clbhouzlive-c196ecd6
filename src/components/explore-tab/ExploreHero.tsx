import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExploreHeroProps {
  className?: string;
  onExploreClick?: () => void;
  onSearchClick?: () => void;
}

/**
 * ExploreHero - Cinematic aspirational hero
 * 
 * Design:
 * - Large, immersive gradient with depth
 * - Multi-layer gradient for cinematic effect
 * - Discover badge with pulse animation
 * - Editorial copy with staggered animations
 * - Polished CTA button
 */
export const ExploreHero: React.FC<ExploreHeroProps> = ({
  className,
  onExploreClick,
  onSearchClick,
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setHasLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleExploreClick = () => {
    // Prioritize search sheet if available
    if (onSearchClick) {
      onSearchClick();
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  return (
    <div className={cn("relative mx-4", className)}>
      {/* Hero Card Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        {/* Background with multi-layer gradients for depth */}
        <div className="relative h-[220px]">
          {/* Primary gradient background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900"
          />
          
          {/* Overlay gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          
          {/* Side gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzAwMDAwMDAyIj48L3JlY3Q+Cjwvc3ZnPg==')] opacity-30" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            {/* Badge with pulse */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={hasLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
              className="flex items-center gap-2 mb-3"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                Discover
              </span>
            </motion.div>
            
            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 6 }}
              animate={hasLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
              className="text-2xl font-bold text-white tracking-tight"
            >
              Where will you play next?
            </motion.h2>
            
            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={hasLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
              className="mt-2 text-sm text-white/70 font-light max-w-md"
            >
              Discover places worth the journey.
            </motion.p>
            
            {/* CTA Button - polished with shadow */}
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={hasLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.5 }}
              onClick={handleExploreClick}
              className="mt-5 self-start inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm rounded-xl transition-colors shadow-lg group"
            >
              <Search className="w-4 h-4" />
              <span>Start exploring</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreHero;
