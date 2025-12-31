/**
 * TextOverlayRenderer - Renders text overlays on media
 * 
 * Used in:
 * - Studio preview (editable, draggable)
 * - Global player surfaces (read-only)
 */

import React, { useRef, useCallback } from 'react';
import { TextOverlay } from '@/types/studio';

interface TextOverlayRendererProps {
  textOverlays: TextOverlay[];
  isEditable?: boolean;
  onChange?: (overlays: TextOverlay[]) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

// Font style mappings
const FONT_STYLES: Record<TextOverlay['style'], string> = {
  modern: 'font-sans font-bold tracking-tight',
  classic: 'font-serif font-medium italic',
  signature: 'font-cursive font-normal',
};

export default function TextOverlayRenderer({
  textOverlays,
  isEditable = false,
  onChange,
  containerRef,
}: TextOverlayRendererProps) {
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
  } | null>(null);

  const handleDragStart = useCallback((
    e: React.TouchEvent | React.MouseEvent,
    overlay: TextOverlay
  ) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      id: overlay.id,
      startX: clientX,
      startY: clientY,
      originalX: overlay.x,
      originalY: overlay.y,
    };

    // Add global listeners
    if ('touches' in e) {
      document.addEventListener('touchmove', handleDragMove as any, { passive: false });
      document.addEventListener('touchend', handleDragEnd as any);
    } else {
      document.addEventListener('mousemove', handleDragMove as any);
      document.addEventListener('mouseup', handleDragEnd as any);
    }
  }, [isEditable]);

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!dragRef.current || !containerRef?.current || !onChange) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (clientX - dragRef.current.startX) / rect.width;
    const deltaY = (clientY - dragRef.current.startY) / rect.height;

    // Clamp to 0..1
    const newX = Math.max(0.05, Math.min(0.95, dragRef.current.originalX + deltaX));
    const newY = Math.max(0.05, Math.min(0.95, dragRef.current.originalY + deltaY));

    const updated = textOverlays.map(overlay =>
      overlay.id === dragRef.current?.id
        ? { ...overlay, x: newX, y: newY }
        : overlay
    );
    onChange(updated);
  }, [textOverlays, onChange, containerRef]);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    document.removeEventListener('touchmove', handleDragMove as any);
    document.removeEventListener('touchend', handleDragEnd as any);
    document.removeEventListener('mousemove', handleDragMove as any);
    document.removeEventListener('mouseup', handleDragEnd as any);
  }, [handleDragMove]);

  if (!textOverlays || textOverlays.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {textOverlays.map((overlay) => {
        const fontClass = FONT_STYLES[overlay.style] || FONT_STYLES.modern;
        const fontSize = Math.round(16 * overlay.scale);

        return (
          <div
            key={overlay.id}
            className={`absolute ${isEditable ? 'pointer-events-auto cursor-move' : ''}`}
            style={{
              left: `${overlay.x * 100}%`,
              top: `${overlay.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={isEditable ? (e) => handleDragStart(e, overlay) : undefined}
            onTouchStart={isEditable ? (e) => handleDragStart(e, overlay) : undefined}
          >
            <span
              className={`${fontClass} whitespace-nowrap select-none`}
              style={{
                color: overlay.color || '#FFFFFF',
                fontSize: `${fontSize}px`,
                textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
                WebkitTextStroke: overlay.color === '#FFFFFF' ? '0.5px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {overlay.text}
            </span>
            
            {/* Drag handle indicator in edit mode */}
            {isEditable && (
              <div 
                className="absolute -inset-2 rounded-lg border-2 border-white/50 border-dashed opacity-60"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
