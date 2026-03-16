// MediaReel — Dark horizontal thumbnail strip with amber active state

import React, { useRef } from 'react';
import { Plus, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AMBER, AMBER_DIM, AMBER_GHOST } from '../tokens';
import type { StudioMediaItem } from '../types';

const THUMB = 72;

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
    <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto py-3 px-4" style={{ scrollbarWidth: 'none' }}>
      <AnimatePresence>
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <motion.div key={item.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 380 }}
              onClick={() => onSelect(index)}
              className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer"
              style={{ width: THUMB, height: THUMB, border: isActive ? '2px solid rgba(232,152,10,0.85)' : '1px solid rgba(255,255,255,0.10)', boxShadow: isActive ? '0 0 8px rgba(200,135,10,0.18)' : 'none', transform: isActive ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.2s, border 0.2s, box-shadow 0.2s', background: 'rgba(255,255,255,0.05)' }}>
              <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
              {item.mediaType === 'video' && (
                <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.70)' }}>
                  <Play className="w-2.5 h-2.5 text-white ml-0.5" fill="white" strokeWidth={0} />
                </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <X className="w-3 h-3 text-white" strokeWidth={2.5} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {items.length < 10 && (
        <motion.button whileTap={{ scale: 0.93 }} onClick={onAddMore} className="shrink-0 rounded-xl flex items-center justify-center" style={{ width: THUMB, height: THUMB, border: '1.5px dashed rgba(232,152,10,0.30)', background: AMBER_GHOST }}>
          <Plus className="w-5 h-5" style={{ color: AMBER_DIM }} strokeWidth={2} />
        </motion.button>
      )}
    </div>
  );
}
