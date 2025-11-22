/**
 * BulkActionBar - Fixed bottom action bar for bulk operations
 * Apple-style glass bar with star/unstar/delete actions
 */

import React from 'react';
import { Star, Trash2, X, FileDown, Tag } from 'lucide-react';

export interface BulkActionBarProps {
  count: number;
  onStar: () => void;
  onUnstar: () => void;
  onDelete: () => void;
  onClear: () => void;
  onExportZip?: (format: 'json' | 'md') => void;
  onBulkTagClick?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  count,
  onStar,
  onUnstar,
  onDelete,
  onClear,
  onExportZip,
  onBulkTagClick,
}) => {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-[640px] anim-slideUp"
      style={{
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="mx-4 rounded-[18px] px-4 py-3 border shadow-lg"
        style={{
          background: 'var(--hub-glass-bg)',
          borderColor: 'var(--hub-stroke)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Count badge */}
          <div className="flex items-center gap-2">
            <div
              className="px-3 py-1.5 rounded-full text-body-sm font-medium"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: 'var(--hub-text)',
              }}
            >
              {count} selected
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onBulkTagClick && (
              <button
                onClick={onBulkTagClick}
                className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Bulk tag selected conversations"
                title="Tag"
              >
                <Tag size={18} style={{ color: 'var(--hub-text)' }} />
              </button>
            )}

            {onExportZip && count >= 2 && (
              <button
                onClick={() => onExportZip('json')}
                className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Export selected as JSON ZIP"
                title="Export JSON"
              >
                <FileDown size={18} style={{ color: 'var(--hub-text)' }} />
              </button>
            )}
            
            <button
              onClick={onStar}
              className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Star selected conversations"
              title="Star"
            >
              <Star size={18} style={{ color: 'var(--hub-text)' }} />
            </button>

            <button
              onClick={onUnstar}
              className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Unstar selected conversations"
              title="Unstar"
            >
              <Star size={18} style={{ color: 'var(--hub-text)' }} fill="currentColor" />
            </button>

            <button
              onClick={onDelete}
              className="p-2 rounded-full hover:bg-red-500/20 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Delete selected conversations"
              title="Delete"
            >
              <Trash2 size={18} style={{ color: 'rgba(255, 59, 48, 0.9)' }} />
            </button>

            <div
              className="w-px h-6 mx-2"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            />

            <button
              onClick={onClear}
              className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Clear selection"
              title="Clear"
            >
              <X size={18} style={{ color: 'var(--hub-text-dim)' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
