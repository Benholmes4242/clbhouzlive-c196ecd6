import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ExploreHeroProps {
  className?: string;
  onExploreClick?: () => void;
}

/**
 * ExploreHero - Sets an aspirational tone immediately
 * 
 * Design:
 * - Large, immersive image
 * - Course-led visual
 * - Minimal copy
 * - One gentle action max
 */
export const ExploreHero: React.FC<ExploreHeroProps> = ({
  className,
  onExploreClick,
}) => {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Hero Image Container */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
        {/* Placeholder gradient - replace with actual course imagery */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-slate-800/95 to-slate-900" />
        
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzAwMDAwMDAyIj48L3JlY3Q+Cjwvc3ZnPg==')] opacity-30" />
        
        {/* Bottom gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-4xl font-serif text-white/95 tracking-tight leading-tight">
              Where will you play next?
            </h2>
            <p className="mt-2 text-sm md:text-base text-white/70 font-light max-w-md">
              Discover places worth the journey
            </p>
            
            {/* Gentle CTA */}
            {onExploreClick && (
              <button
                onClick={onExploreClick}
                className="mt-5 inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors group"
              >
                <span>Start exploring</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreHero;
