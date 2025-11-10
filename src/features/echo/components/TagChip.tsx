/**
 * TagChip - Conversation tag pill
 * Glass-style chip with optional remove action
 */

import React from 'react';
import { X } from 'lucide-react';

export interface TagChipProps {
  label: string;
  onRemove?: () => void;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  label,
  onRemove,
  clickable,
  onClick,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
        clickable ? 'cursor-pointer hover:bg-white/12' : ''
      } ${className}`}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'var(--hub-text)',
      }}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={handleRemove}
          className="p-0.5 rounded-full hover:bg-white/15 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
          aria-label={`Remove tag ${label}`}
          tabIndex={0}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};
