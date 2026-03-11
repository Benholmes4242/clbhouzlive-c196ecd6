// MediaReel — Horizontal thumbnail strip for all media items
// Active item has amber ring + glow. Drag to reorder. + button to add more.

import React, { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { REEL_THUMB_SIZE } from '../constants';
import type { StudioMediaItem } from '../types';

interface MediaReelProps {
  items: StudioMediaItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
}

export function MediaReel({ items, activeIndex, onSelect, onRemove, onAddMore }: MediaReelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (items.length <= 1) return null;

  return (
    <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto py-2 px-4 scrollbar-hide">
      <AnimatePresence>
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <motion.button
              key={item.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => onSelect(index)}
              className={`relative shrink-0 rounded-lg overflow-hidden transition-all ${
                isActive
                  ? 'ring-2 ring-primary scale-105 shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
                  : 'ring-1 ring-border/50'
              }`}
              style={{ width: REEL_THUMB_SIZE, height: REEL_THUMB_SIZE }}
            >
              <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              {item.mediaType === 'video' && (
                <div className="absolute bottom-0.5 left-0.5 bg-black/60 rounded px-1">
                  <span className="text-white text-[8px]">▶</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>

      {items.length < 10 && (
        <button
          onClick={onAddMore}
          className="shrink-0 rounded-lg border-2 border-dashed border-primary/40 flex items-center justify-center"
          style={{ width: REEL_THUMB_SIZE, height: REEL_THUMB_SIZE }}
        >
          <Plus className="w-5 h-5 text-primary" />
        </button>
      )}
    </div>
  );
}
