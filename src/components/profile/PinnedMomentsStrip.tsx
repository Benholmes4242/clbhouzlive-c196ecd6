import React, { useState } from 'react';
import { Plus, Heart, Trophy, Flag, Camera, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PinnedMoment {
  id: string;
  type: 'bucket-list' | 'hole-in-one' | 'best-round' | 'favorite-course' | 'achievement' | 'custom';
  label: string;
  coverUrl?: string;
  icon?: React.ElementType;
}

interface PinnedMomentsStripProps {
  moments: PinnedMoment[];
  isOwnProfile: boolean;
  onMomentClick?: (moment: PinnedMoment) => void;
  onCreateClick?: () => void;
}

const DEFAULT_ICONS: Record<PinnedMoment['type'], React.ElementType> = {
  'bucket-list': Heart,
  'hole-in-one': Star,
  'best-round': Trophy,
  'favorite-course': Flag,
  'achievement': Trophy,
  'custom': Camera,
};

/**
 * PinnedMomentsStrip - Horizontal scrollable pinned moments
 * Position: Between tabs and content grid
 * Tiles: Rounded rectangles 70×90px
 * Create button on right with "+"
 */
const PinnedMomentsStrip: React.FC<PinnedMomentsStripProps> = ({
  moments,
  isOwnProfile,
  onMomentClick,
  onCreateClick,
}) => {
  // Don't render if no moments and not own profile
  if (moments.length === 0 && !isOwnProfile) return null;

  return (
    <section className="mt-4 mb-2">
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex items-center gap-3" style={{ minWidth: 'max-content' }}>
          {/* Existing moments */}
          {moments.map((moment) => {
            const Icon = moment.icon || DEFAULT_ICONS[moment.type] || Camera;
            
            return (
              <button
                key={moment.id}
                type="button"
                onClick={() => onMomentClick?.(moment)}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'w-[70px] h-[90px]',
                  'rounded-sq-md',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'transition-all duration-150',
                  'hover:bg-white/[0.08] active:scale-[0.98]',
                  'overflow-hidden'
                )}
              >
                {moment.coverUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={moment.coverUrl} 
                      alt={moment.label}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-0 right-0 text-[10px] font-medium text-white text-center px-1 truncate">
                      {moment.label}
                    </span>
                  </div>
                ) : (
                  <>
                    <Icon className="w-6 h-6 text-foreground/60 mb-2" />
                    <span className="text-[10px] font-medium text-foreground/80 text-center px-1 leading-tight">
                      {moment.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
          
          {/* Create new moment button - only for own profile */}
          {isOwnProfile && (
            <button
              type="button"
              onClick={onCreateClick}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-[70px] h-[90px]',
                'rounded-sq-md',
                'border-2 border-dashed border-white/[0.15]',
                'transition-all duration-150',
                'hover:border-white/[0.25] hover:bg-white/[0.04]',
                'active:scale-[0.98]'
              )}
            >
              <Plus className="w-6 h-6 text-foreground/50 mb-1" />
              <span className="text-[10px] font-medium text-foreground/50">
                Add
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default PinnedMomentsStrip;
