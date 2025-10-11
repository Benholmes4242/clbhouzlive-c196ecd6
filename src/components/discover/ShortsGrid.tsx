import React from 'react';
import { ExploreContentItem } from '@/components/explore/types';

interface ShortsGridProps {
  items: ExploreContentItem[];
  onOpen: (item: ExploreContentItem) => void;
}

export default function ShortsGrid({ items, onOpen }: ShortsGridProps) {
  return (
    <div
      className="
        grid gap-1
        grid-cols-3
        md:grid-cols-4
        xl:grid-cols-5
        px-4 md:px-6
        pb-4
      "
    >
      {items.map((item) => (
        <button
          key={item.id}
          className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-muted"
          onClick={() => onOpen(item)}
        >
          <img
            src={item.thumbnailSrc || item.src}
            alt={item.title || ''}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
        </button>
      ))}
    </div>
  );
}
