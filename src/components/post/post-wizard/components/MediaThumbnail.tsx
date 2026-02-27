import { X, Wand2 } from 'lucide-react';
import type { OrderedMediaItem } from '../types';

interface MediaThumbnailProps {
  item: OrderedMediaItem;
  index: number;
  isCover: boolean;
  totalItems: number;
  hasStudioEdits: boolean;
  onRemove: () => void;
  onExpand: () => void;
  onStudio: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaThumbnail({
  item,
  isCover,
  totalItems,
  hasStudioEdits,
  onRemove,
  onExpand,
  onStudio,
}: MediaThumbnailProps) {
  return (
    <div className="relative flex-shrink-0 w-[140px] h-[140px] rounded-2xl overflow-hidden group">
      {/* Media */}
      {item.type === 'video' ? (
        <video src={item.previewUrl} className="w-full h-full object-cover" muted playsInline />
      ) : (
        <img src={item.previewUrl} className="w-full h-full object-cover" alt="" />
      )}

      {/* Tap to expand (full thumbnail area) */}
      <button
        onClick={onExpand}
        className="absolute inset-0 z-[1]"
        aria-label="Preview media fullscreen"
      />

      {/* Studio edit button (bottom-left) */}
      <button
        onClick={(e) => { e.stopPropagation(); onStudio(); }}
        className="absolute bottom-2 left-2 z-[2] w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(16px)' }}
        aria-label="Edit in studio"
      >
        <Wand2 className="w-3.5 h-3.5 text-white" />
        {hasStudioEdits && (
          <div
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ backgroundColor: '#f59e0b', borderColor: 'rgba(0,0,0,0.50)' }}
          />
        )}
      </button>

      {/* Remove button (top-right) */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 z-[2] w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)' }}
        aria-label="Remove media"
      >
        <X className="w-3 h-3 text-white" />
      </button>

      {/* Cover badge */}
      {isCover && totalItems > 1 && (
        <span
          className="absolute bottom-2 right-2 z-[2] px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
          style={{ background: 'rgba(245,158,11,0.85)' }}
        >
          Cover
        </span>
      )}

      {/* Video duration indicator */}
      {item.type === 'video' && item.duration && (
        <span
          className="absolute top-2 left-2 z-[2] px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          {formatDuration(item.duration)}
        </span>
      )}
    </div>
  );
}
