/**
 * TextOverlayRenderer - Renders text overlays on media
 * 
 * Used in:
 * - Studio preview (editable, draggable)
 * - Global player surfaces (read-only)
 */

import React, { useRef, useCallback } from 'react';
import { TextOverlay, TextStyle } from '@/types/studio';
import { cn } from '@/lib/utils';

interface TextOverlayRendererProps {
  textOverlays: TextOverlay[];
  isEditable?: boolean;
  onChange?: (overlays: TextOverlay[]) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

// 8 text style variants with distinctive visual characteristics
type TextVariantConfig = {
  fontClass: string;
  textTransform?: 'uppercase' | 'none';
  shadowStyle?: string;
  bgClass?: string;
  strokeStyle?: string;
  glowStyle?: string;
};

const TEXT_VARIANTS: Record<TextStyle, TextVariantConfig> = {
  // Modern Bold - Clean sans-serif with strong presence
  modern_bold: {
    fontClass: 'font-sans font-extrabold tracking-tight',
    textTransform: 'none',
    shadowStyle: '0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
  },
  // Classic Serif - Elegant editorial style
  classic_serif: {
    fontClass: 'font-serif font-medium italic',
    textTransform: 'none',
    shadowStyle: '0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  },
  // Signature - Handwritten cursive feel
  signature: {
    fontClass: 'font-cursive font-normal',
    textTransform: 'none',
    shadowStyle: '0 2px 10px rgba(0,0,0,0.45)',
  },
  // Impact - Bold uppercase sports/action style
  impact: {
    fontClass: 'font-sans font-black tracking-wider',
    textTransform: 'uppercase',
    shadowStyle: '0 4px 16px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)',
  },
  // Outline - Text with visible stroke/outline
  outline: {
    fontClass: 'font-sans font-bold tracking-wide',
    textTransform: 'uppercase',
    strokeStyle: '2px',
    shadowStyle: '0 2px 8px rgba(0,0,0,0.3)',
  },
  // Neon - Glowing effect
  neon: {
    fontClass: 'font-sans font-bold tracking-normal',
    textTransform: 'none',
    glowStyle: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor',
  },
  // Glass - Frosted glass pill background
  glass: {
    fontClass: 'font-sans font-semibold tracking-normal',
    textTransform: 'none',
    bgClass: 'bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20',
    shadowStyle: 'none',
  },
  // Scoreboard - Monospace sports ticker style
  scoreboard: {
    fontClass: 'font-mono font-bold tracking-widest',
    textTransform: 'uppercase',
    bgClass: 'bg-black/70 px-3 py-1 rounded-sm border border-white/10',
    shadowStyle: 'none',
  },
  // Legacy support mappings
  modern: {
    fontClass: 'font-sans font-bold tracking-tight',
    shadowStyle: '0 2px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
  },
  classic: {
    fontClass: 'font-serif font-medium italic',
    shadowStyle: '0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  },
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

    // Clamp to 0.05..0.95
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
    <div 
      className="absolute inset-0 overflow-hidden z-30"
      style={{ pointerEvents: isEditable ? 'auto' : 'none' }}
    >
      {textOverlays.map((overlay) => {
        const variant = TEXT_VARIANTS[overlay.style] || TEXT_VARIANTS.modern_bold;
        // Scale font size: base 20px, range 12-56px
        const fontSize = Math.max(12, Math.min(56, Math.round(20 * overlay.scale)));
        
        const textColor = overlay.color || '#FFFFFF';
        
        // Build text shadow based on variant
        let textShadow = variant.shadowStyle || 'none';
        if (variant.glowStyle) {
          textShadow = variant.glowStyle;
        }
        
        // Build stroke style for outline variant
        const strokeStyle = variant.strokeStyle 
          ? `${variant.strokeStyle} ${textColor === '#FFFFFF' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}`
          : 'none';

        return (
          <div
            key={overlay.id}
            className={cn(
              "absolute",
              isEditable && "cursor-move"
            )}
            style={{
              left: `${overlay.x * 100}%`,
              top: `${overlay.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
            }}
            onMouseDown={isEditable ? (e) => handleDragStart(e, overlay) : undefined}
            onTouchStart={isEditable ? (e) => handleDragStart(e, overlay) : undefined}
          >
            <span
              className={cn(
                variant.fontClass,
                variant.bgClass,
                'whitespace-nowrap select-none inline-block'
              )}
              style={{
                color: textColor,
                fontSize: `${fontSize}px`,
                textShadow,
                WebkitTextStroke: strokeStyle !== 'none' ? strokeStyle : undefined,
                textTransform: variant.textTransform || 'none',
                // Paint order ensures stroke appears behind fill
                paintOrder: variant.strokeStyle ? 'stroke fill' : undefined,
              }}
            >
              {overlay.text}
            </span>
            
            {/* Drag handle indicator in edit mode */}
            {isEditable && (
              <div 
                className="absolute -inset-2 rounded-lg border-2 border-white/60 border-dashed opacity-70 pointer-events-none"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}