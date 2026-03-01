import { X, Wand2, Play } from 'lucide-react';
import { formatDuration } from '@/utils/formatDuration';
import type { OrderedMediaItem } from '../types';
import type { StudioEdits } from '@/types/studio';
import { getFilterClass } from '@/utils/studioFilters';
import { getRotateStyle } from '@/utils/studioEdit';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { cn } from '@/lib/utils';

interface MediaThumbnailProps {
  item: OrderedMediaItem;
  index: number;
  isCover: boolean;
  totalItems: number;
  hasStudioEdits: boolean;
  studioEdits?: StudioEdits;
  onRemove: () => void;
  onExpand: () => void;
  onStudio: () => void;
  onSetCover?: () => void;
  isViewerOpen?: boolean;
  /** Hide the studio wand button (default: true) */
  showStudio?: boolean;
}

export function MediaThumbnail({
  item,
  isCover,
  totalItems,
  hasStudioEdits,
  studioEdits,
  onRemove,
  onExpand,
  onStudio,
  onSetCover,
  isViewerOpen,
  showStudio = true,
}: MediaThumbnailProps) {
  const filterClass = studioEdits?.filter && studioEdits.filter !== 'normal'
    ? getFilterClass(studioEdits.filter)
    : '';

  const transformStyle: React.CSSProperties = {
    ...getRotateStyle(studioEdits?.rotate),
    ...(studioEdits?.flipH ? { transform: `${getRotateStyle(studioEdits?.rotate).transform || ''} scaleX(-1)`.trim() } : {}),
    ...(studioEdits?.flipV ? { transform: `${getRotateStyle(studioEdits?.rotate).transform || ''} scaleY(-1)`.trim() } : {}),
  };

  // Build combined transform string
  const transforms: string[] = [];
  if (studioEdits?.rotate) transforms.push(`rotate(${studioEdits.rotate}deg)`);
  if (studioEdits?.flipH) transforms.push('scaleX(-1)');
  if (studioEdits?.flipV) transforms.push('scaleY(-1)');
  const mediaTransformStyle: React.CSSProperties = transforms.length > 0
    ? { transform: transforms.join(' '), transformOrigin: 'center' }
    : {};

  return (
    <div className="relative flex-shrink-0 w-[160px] h-[160px] rounded-2xl overflow-hidden group">
      {/* Media with studio edits applied */}
      <div className="relative w-full h-full">
        {item.type === 'video' ? (
          isViewerOpen ? (
            <img
              src={item.thumbnailUrl || item.previewUrl}
              className={cn('w-full h-full object-cover', filterClass)}
              style={mediaTransformStyle}
              alt=""
            />
          ) : (
            <video
              src={item.previewUrl}
              className={cn('w-full h-full object-cover', filterClass)}
              style={mediaTransformStyle}
              autoPlay
              loop
              muted
              playsInline
              poster={item.thumbnailUrl}
            />
          )
        ) : (
          <img
            src={item.previewUrl}
            className={cn('w-full h-full object-cover', filterClass)}
            style={mediaTransformStyle}
            alt=""
          />
        )}

        {/* Text overlays on thumbnail (non-editable, scaled to thumbnail size) */}
        {studioEdits?.textOverlays && studioEdits.textOverlays.length > 0 && (
          <TextOverlayRenderer
            textOverlays={studioEdits.textOverlays}
            isEditable={false}
            safeAreaContext="feed"
          />
        )}
      </div>

      {/* Play icon overlay for videos */}
      {item.type === 'video' && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
          >
            <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}


      {/* Tap to expand (full thumbnail area) */}
      <button
        onClick={onExpand}
        className="absolute inset-0 z-[1]"
        aria-label="Preview media fullscreen"
      />

      {/* Studio edit button (bottom-left) — enlarged tap target */}
      {showStudio && (
        <button
          onClick={(e) => { e.stopPropagation(); onStudio(); }}
          className="absolute bottom-1.5 left-1.5 z-[2] w-9 h-9 flex items-center justify-center"
          aria-label="Edit in studio"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center relative"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
          >
            <Wand2 className="w-3.5 h-3.5 text-white" />
            {hasStudioEdits && (
              <div
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{ backgroundColor: '#f59e0b', borderColor: 'rgba(0,0,0,0.50)' }}
              />
            )}
          </div>
        </button>
      )}

      {/* Remove button (top-right) — enlarged tap target */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1.5 right-1.5 z-[2] w-9 h-9 flex items-center justify-center"
        aria-label="Remove media"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
        >
          <X className="w-3 h-3 text-white" />
        </div>
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
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {isCover ? 'Cover' : 'Set Cover'}
        </button>
      )}
    </div>
  );
}
