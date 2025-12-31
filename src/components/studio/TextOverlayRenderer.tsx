/**
 * TextOverlayRenderer - Renders text overlays on media
 * 
 * Features:
 * - 8 style variants (modern_bold, classic_serif, signature, impact, outline, neon, glass, scoreboard)
 * - Drag to reposition (in edit/position mode)
 * - Pinch to scale (touch)
 * - Rotation handle (drag to rotate)
 * - Snap-to-center guides
 * - Selection model for active overlay
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TextOverlay, TextStyle } from '@/types/studio';
import { cn } from '@/lib/utils';
import { RotateCw } from 'lucide-react';

interface TextOverlayRendererProps {
  textOverlays: TextOverlay[];
  isEditable?: boolean;
  onChange?: (overlays: TextOverlay[]) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  activeOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
}

// Snap configuration
const SNAP_TOLERANCE = 0.02; // 2% of container
const SNAP_RELEASE_TOLERANCE = 0.03;

// Scale bounds
const MIN_SCALE = 0.6;
const MAX_SCALE = 3.0;

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

function touchDistance(t1: React.Touch, t2: React.Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function TextOverlayRenderer({
  textOverlays,
  isEditable = false,
  onChange,
  containerRef,
  activeOverlayId,
  onSelectOverlay,
}: TextOverlayRendererProps) {
  // Guide visibility state
  const [showGuideX, setShowGuideX] = useState(false);
  const [showGuideY, setShowGuideY] = useState(false);
  
  // Internal active overlay if not controlled
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const currentActiveId = activeOverlayId !== undefined ? activeOverlayId : internalActiveId;
  
  const handleSelectOverlay = useCallback((id: string | null) => {
    if (onSelectOverlay) {
      onSelectOverlay(id);
    } else {
      setInternalActiveId(id);
    }
  }, [onSelectOverlay]);
  
  // Drag state
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
  } | null>(null);
  
  // Pinch state
  const pinchRef = useRef<{
    id: string;
    startDistance: number;
    startScale: number;
  } | null>(null);
  
  // Rotation state
  const rotateRef = useRef<{
    id: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    startRotation: number;
  } | null>(null);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('touchmove', handleDragMove as any);
      document.removeEventListener('touchend', handleDragEnd as any);
      document.removeEventListener('mousemove', handleDragMove as any);
      document.removeEventListener('mouseup', handleDragEnd as any);
    };
  }, []);

  const handleDragStart = useCallback((
    e: React.TouchEvent | React.MouseEvent,
    overlay: TextOverlay
  ) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Select this overlay
    handleSelectOverlay(overlay.id);

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
  }, [isEditable, handleSelectOverlay]);

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    // Handle pinch if two fingers
    if ('touches' in e && e.touches.length === 2 && pinchRef.current && onChange) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0], e.touches[1]);
      const ratio = dist / pinchRef.current.startDistance;
      const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.startScale * ratio));
      
      const updated = textOverlays.map(overlay =>
        overlay.id === pinchRef.current?.id
          ? { ...overlay, scale: nextScale }
          : overlay
      );
      onChange(updated);
      return;
    }
    
    if (!dragRef.current || !containerRef?.current || !onChange) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (clientX - dragRef.current.startX) / rect.width;
    const deltaY = (clientY - dragRef.current.startY) / rect.height;

    let newX = dragRef.current.originalX + deltaX;
    let newY = dragRef.current.originalY + deltaY;
    
    // Apply soft snap to center
    const nearCenterX = Math.abs(newX - 0.5) <= SNAP_TOLERANCE;
    const nearCenterY = Math.abs(newY - 0.5) <= SNAP_TOLERANCE;
    
    if (nearCenterX) newX = 0.5;
    if (nearCenterY) newY = 0.5;
    
    setShowGuideX(nearCenterX);
    setShowGuideY(nearCenterY);
    
    // Clamp to 0.05..0.95
    newX = Math.max(0.05, Math.min(0.95, newX));
    newY = Math.max(0.05, Math.min(0.95, newY));

    const updated = textOverlays.map(overlay =>
      overlay.id === dragRef.current?.id
        ? { ...overlay, x: newX, y: newY }
        : overlay
    );
    onChange(updated);
  }, [textOverlays, onChange, containerRef]);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    pinchRef.current = null;
    setShowGuideX(false);
    setShowGuideY(false);
    document.removeEventListener('touchmove', handleDragMove as any);
    document.removeEventListener('touchend', handleDragEnd as any);
    document.removeEventListener('mousemove', handleDragMove as any);
    document.removeEventListener('mouseup', handleDragEnd as any);
  }, [handleDragMove]);
  
  // Handle pinch start (two finger touch)
  const handleTouchStart = useCallback((
    e: React.TouchEvent,
    overlay: TextOverlay
  ) => {
    if (!isEditable) return;
    
    // Select this overlay
    handleSelectOverlay(overlay.id);
    
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      const dist = touchDistance(e.touches[0], e.touches[1]);
      pinchRef.current = {
        id: overlay.id,
        startDistance: dist,
        startScale: overlay.scale,
      };
      
      document.addEventListener('touchmove', handleDragMove as any, { passive: false });
      document.addEventListener('touchend', handleDragEnd as any);
    } else {
      handleDragStart(e, overlay);
    }
  }, [isEditable, handleDragStart, handleDragMove, handleDragEnd, handleSelectOverlay]);
  
  // Rotation handle drag
  const handleRotateStart = useCallback((
    e: React.TouchEvent | React.MouseEvent,
    overlay: TextOverlay
  ) => {
    if (!isEditable || !containerRef?.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + overlay.x * rect.width;
    const centerY = rect.top + overlay.y * rect.height;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const startAngle = Math.atan2(clientY - centerY, clientX - centerX);
    
    rotateRef.current = {
      id: overlay.id,
      centerX,
      centerY,
      startAngle,
      startRotation: overlay.rotation ?? 0,
    };
    
    if ('touches' in e) {
      document.addEventListener('touchmove', handleRotateMove as any, { passive: false });
      document.addEventListener('touchend', handleRotateEnd as any);
    } else {
      document.addEventListener('mousemove', handleRotateMove as any);
      document.addEventListener('mouseup', handleRotateEnd as any);
    }
  }, [isEditable, containerRef]);
  
  const handleRotateMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!rotateRef.current || !onChange) return;
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const currentAngle = Math.atan2(
      clientY - rotateRef.current.centerY, 
      clientX - rotateRef.current.centerX
    );
    
    const deltaAngle = currentAngle - rotateRef.current.startAngle;
    let degrees = deltaAngle * (180 / Math.PI);
    let nextRotation = rotateRef.current.startRotation + degrees;
    
    // Soft snap to 0, 90, 180, -90
    const snapAngles = [0, 90, 180, -90, -180];
    for (const snap of snapAngles) {
      if (Math.abs(nextRotation - snap) < 5) {
        nextRotation = snap;
        break;
      }
    }
    
    // Normalize to -180..180
    while (nextRotation > 180) nextRotation -= 360;
    while (nextRotation < -180) nextRotation += 360;
    
    const updated = textOverlays.map(overlay =>
      overlay.id === rotateRef.current?.id
        ? { ...overlay, rotation: nextRotation }
        : overlay
    );
    onChange(updated);
  }, [textOverlays, onChange]);
  
  const handleRotateEnd = useCallback(() => {
    rotateRef.current = null;
    document.removeEventListener('touchmove', handleRotateMove as any);
    document.removeEventListener('touchend', handleRotateEnd as any);
    document.removeEventListener('mousemove', handleRotateMove as any);
    document.removeEventListener('mouseup', handleRotateEnd as any);
  }, [handleRotateMove]);

  if (!textOverlays || textOverlays.length === 0) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 overflow-hidden z-30"
      style={{ pointerEvents: isEditable ? 'auto' : 'none' }}
    >
      {/* Snap guides - only visible when positioning */}
      {isEditable && (showGuideX || showGuideY) && (
        <>
          {showGuideX && (
            <div 
              className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none z-40"
              style={{ left: '50%' }}
            />
          )}
          {showGuideY && (
            <div 
              className="absolute left-0 right-0 h-px bg-white/50 pointer-events-none z-40"
              style={{ top: '50%' }}
            />
          )}
        </>
      )}
      
      {textOverlays.map((overlay) => {
        const variant = TEXT_VARIANTS[overlay.style] || TEXT_VARIANTS.modern_bold;
        // Scale font size: base 20px, range 12-56px
        const fontSize = Math.max(12, Math.min(56, Math.round(20 * overlay.scale)));
        
        const textColor = overlay.color || '#FFFFFF';
        const rotation = overlay.rotation ?? 0;
        const isActive = currentActiveId === overlay.id;
        
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
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              zIndex: isActive ? 10 : 5,
            }}
            onMouseDown={isEditable ? (e) => handleDragStart(e, overlay) : undefined}
            onTouchStart={isEditable ? (e) => handleTouchStart(e, overlay) : undefined}
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
            
            {/* Drag handle indicator + rotation handle in edit mode */}
            {isEditable && (
              <>
                <div 
                  className={cn(
                    "absolute -inset-2 rounded-lg border-2 border-dashed pointer-events-none transition-opacity",
                    isActive ? "border-white opacity-90" : "border-white/40 opacity-50"
                  )}
                />
                
                {/* Rotation handle - only show for active overlay */}
                {isActive && (
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white/90 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleRotateStart(e, overlay)}
                    onTouchStart={(e) => handleRotateStart(e, overlay)}
                  >
                    <RotateCw className="w-4 h-4 text-zinc-700" />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
