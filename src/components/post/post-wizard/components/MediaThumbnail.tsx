import { X, Wand2, Play } from 'lucide-react';
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
  onSetCover?: () => void;
}

export function MediaThumbnail({
  item,
  isCover,
  totalItems,
  hasStudioEdits,
  onRemove,
  onExpand,
  onStudio,
  onSetCover,
}: MediaThumbnailProps) {
  return (
    <div className="relative flex-shrink-0 w-[140px] h-[140px] rounded-2xl overflow-hidden group">
      {/* Media */}
      {item.type === 'video' ? (
        <video
          src={item.previewUrl}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster={item.thumbnailUrl}
        />
      ) : (
        <img src={item.previewUrl} className="w-full h-full object-cover" alt="" />
      )}

      {/* Play icon overlay for videos */}
      {item.type === 'video' && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
          >
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          </div>
        </div>
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

      {/* Cover selection — only show when multiple items */}
      {totalItems > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isCover) onSetCover?.();
          }}
          className="absolute bottom-2 right-2 z-[2] px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all"
          style={isCover ? {
            background: '#f59e0b',
            color: '#FFFFFF',
            boxShadow: '0 1px 4px rgba(245,158,11,0.3)',
          } : {
            background: 'rgba(0,0,0,0.40)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {isCover ? 'Cover' : 'Set Cover'}
        </button>
      )}
    </div>
  );
}
