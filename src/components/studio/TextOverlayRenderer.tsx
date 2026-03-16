/**
 * TextOverlayRenderer - Renders text overlays on media
 * 
 * Features:
 * - 8 style variants (modern_bold, classic_serif, signature, impact, outline, neon, glass, scoreboard)
 * - Drag to reposition (in edit/position mode)
 * - Pinch to scale (touch) - scales entire wrapper for proportional bg scaling
 * - Rotation handle (drag to rotate) with 15° snapping
 * - Enhanced snap guides: center, thirds, safe margins with hysteresis
 * - UI-safe margins based on context
 * - Selection model with z-ordering
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TextOverlay, TextStyle } from '@/types/studio';
import { cn } from '@/lib/utils';
import { RotateCw } from 'lucide-react';

// Safe area context type
type SafeAreaContext = 'create' | 'fullscreen' | 'feed';

interface TextOverlayRendererProps {
  textOverlays: TextOverlay[];
  isEditable?: boolean;
  onChange?: (overlays: TextOverlay[]) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  activeOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
  safeAreaContext?: SafeAreaContext;
}

// ===== SNAP CONFIGURATION =====
// Snap targets (normalized 0..1)
const SNAP_TARGETS_X = [0.5, 1/3, 2/3, 0.1, 0.9]; // center, thirds, safe margins
const SNAP_TARGETS_Y = [0.5, 1/3, 2/3, 0.1, 0.9];

// Snap tolerances with hysteresis
const SNAP_IN_TOLERANCE = 0.02;  // 2% to snap in
const SNAP_OUT_TOLERANCE = 0.03; // 3% to snap out

// Guide types for styling
type GuideType = 'center' | 'thirds' | 'safe';
type ActiveGuide = { position: number; type: GuideType };

// ===== ROTATION SNAPPING =====
const ROTATION_SNAP_STEP = 15; // degrees
const ROTATION_SNAP_IN = 4;   // degrees
const ROTATION_SNAP_OUT = 6;  // degrees
const CARDINAL_ANGLES = [0, 90, 180, -90, -180, 270];
const CARDINAL_SNAP_TOLERANCE = 6; // stronger snap at cardinals

// ===== SCALE BOUNDS =====
const MIN_SCALE = 0.6;
const MAX_SCALE = 3.0;
const BASE_FONT_SIZE = 20; // Fixed base, scaling via transform

// ===== SAFE AREA INSETS =====
type SafeInsets = { top: number; right: number; bottom: number; left: number };

function getSafeInsets(context: SafeAreaContext): SafeInsets {
  switch (context) {
    case 'create':
      return { top: 40, right: 16, bottom: 100, left: 16 };
    case 'fullscreen':
      return { top: 56, right: 16, bottom: 140, left: 16 };
    case 'feed':
    default:
      return { top: 16, right: 16, bottom: 80, left: 16 };
  }
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
  modern_bold: {
    fontClass: 'font-sans font-extrabold tracking-tight',
    textTransform: 'none',
  },
  classic_serif: {
    fontClass: 'font-serif font-medium italic',
    textTransform: 'none',
  },
  signature: {
    fontClass: 'font-cursive font-normal',
    textTransform: 'none',
  },
  impact: {
    fontClass: 'font-sans font-black tracking-wider',
    textTransform: 'uppercase',
  },
  outline: {
    fontClass: 'font-sans font-bold tracking-wide',
    textTransform: 'uppercase',
  },
  neon: {
    fontClass: 'font-sans font-bold tracking-normal',
    textTransform: 'none',
  },
  glass: {
    fontClass: 'font-sans font-semibold tracking-normal',
    textTransform: 'none',
  },
  scoreboard: {
    fontClass: 'font-mono font-bold tracking-widest',
    textTransform: 'uppercase',
  },
  modern: {
    fontClass: 'font-sans font-bold tracking-tight',
  },
  classic: {
    fontClass: 'font-serif font-medium italic',
  },
};

function touchDistance(t1: React.Touch, t2: React.Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getGuideType(target: number): GuideType {
  if (target === 0.5) return 'center';
  if (target === 1/3 || target === 2/3) return 'thirds';
  return 'safe';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Snap value with hysteresis
function snapWithHysteresis(
  value: number,
  targets: number[],
  currentlySnappedTo: number | null,
  snapIn: number,
  snapOut: number
): { snapped: number; target: number | null } {
  // Check if we should stay snapped (hysteresis)
  if (currentlySnappedTo !== null) {
    const delta = Math.abs(value - currentlySnappedTo);
    if (delta <= snapOut) {
      return { snapped: currentlySnappedTo, target: currentlySnappedTo };
    }
  }
  
  // Find nearest target
  let nearestTarget: number | null = null;
  let nearestDelta = Infinity;
  
  for (const target of targets) {
    const delta = Math.abs(value - target);
    if (delta < nearestDelta) {
      nearestDelta = delta;
      nearestTarget = target;
    }
  }
  
  // Snap if within tolerance
  if (nearestTarget !== null && nearestDelta <= snapIn) {
    return { snapped: nearestTarget, target: nearestTarget };
  }
  
  return { snapped: value, target: null };
}

// Rotation snapping with 15° steps and cardinal priority
function snapRotation(
  raw: number,
  currentlySnappedTo: number | null
): { snapped: number; isSnapped: boolean } {
  // Check cardinal angles first (stronger snap)
  for (const cardinal of CARDINAL_ANGLES) {
    const delta = Math.abs(raw - cardinal);
    if (delta <= CARDINAL_SNAP_TOLERANCE) {
      return { snapped: cardinal, isSnapped: true };
    }
  }
  
  // Hysteresis for current snap
  if (currentlySnappedTo !== null) {
    const delta = Math.abs(raw - currentlySnappedTo);
    if (delta <= ROTATION_SNAP_OUT) {
      return { snapped: currentlySnappedTo, isSnapped: true };
    }
  }
  
  // Snap to nearest 15° step
  const nearest = Math.round(raw / ROTATION_SNAP_STEP) * ROTATION_SNAP_STEP;
  const delta = Math.abs(raw - nearest);
  
  if (delta <= ROTATION_SNAP_IN) {
    return { snapped: nearest, isSnapped: true };
  }
  
  return { snapped: raw, isSnapped: false };
}

export default function TextOverlayRenderer({
  textOverlays,
  isEditable = false,
  onChange,
  containerRef,
  activeOverlayId,
  onSelectOverlay,
  safeAreaContext = 'feed',
}: TextOverlayRendererProps) {
  // Active guides state
  const [activeGuideX, setActiveGuideX] = useState<ActiveGuide | null>(null);
  const [activeGuideY, setActiveGuideY] = useState<ActiveGuide | null>(null);
  const [rotationLabel, setRotationLabel] = useState<number | null>(null);
  
  // Snap state refs for hysteresis
  const snappedXRef = useRef<number | null>(null);
  const snappedYRef = useRef<number | null>(null);
  const snappedRotationRef = useRef<number | null>(null);
  
  // Internal active overlay if not controlled
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const currentActiveId = activeOverlayId !== undefined ? activeOverlayId : internalActiveId;
  
  // Compute safe bounds based on container and context
  const safeBounds = useMemo(() => {
    if (!containerRef?.current) {
      return { minX: 0.05, maxX: 0.95, minY: 0.05, maxY: 0.95 };
    }
    const rect = containerRef.current.getBoundingClientRect();
    const insets = getSafeInsets(safeAreaContext);
    return {
      minX: insets.left / rect.width,
      maxX: 1 - insets.right / rect.width,
      minY: insets.top / rect.height,
      maxY: 1 - insets.bottom / rect.height,
    };
  }, [containerRef, safeAreaContext]);
  
  // Dynamic snap targets including safe bounds
  const snapTargetsX = useMemo(() => [0.5, 1/3, 2/3, safeBounds.minX, safeBounds.maxX], [safeBounds]);
  const snapTargetsY = useMemo(() => [0.5, 1/3, 2/3, safeBounds.minY, safeBounds.maxY], [safeBounds]);
  
  // Sort overlays by z-order: active on top, then by position
  const sortedOverlays = useMemo(() => {
    return [...textOverlays].sort((a, b) => {
      if (a.id === currentActiveId) return 1;
      if (b.id === currentActiveId) return -1;
      return 0;
    });
  }, [textOverlays, currentActiveId]);
  
  const handleSelectOverlay = useCallback((id: string | null) => {
    if (onSelectOverlay) {
      onSelectOverlay(id);
    } else {
      setInternalActiveId(id);
    }
  }, [onSelectOverlay]);
  
  // Pointer ID for capture (works across mouse/touch/pen)
  const pointerIdRef = useRef<number | null>(null);
  
  // Multi-pointer tracking for pinch (pointer events based)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  
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
  
  // Store latest handlers in refs to avoid stale closures in event listeners
  const onChangeRef = useRef(onChange);
  const textOverlaysRef = useRef(textOverlays);
  useEffect(() => {
    onChangeRef.current = onChange;
    textOverlaysRef.current = textOverlays;
  }, [onChange, textOverlays]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMoveRef.current);
      document.removeEventListener('pointerup', handlePointerEndRef.current);
      document.removeEventListener('pointercancel', handlePointerEndRef.current);
      document.removeEventListener('pointermove', handleRotateMoveRef.current);
      document.removeEventListener('pointerup', handleRotateEndRef.current);
      document.removeEventListener('pointercancel', handleRotateEndRef.current);
    };
  }, []);

  // Pointer-based drag start (unified for mouse/touch/pen)
  const handlePointerDown = useCallback((
    e: React.PointerEvent,
    overlay: TextOverlay
  ) => {
    if (!isEditable) return;
    
    // Only allow dragging the active overlay
    if (currentActiveId && overlay.id !== currentActiveId) {
      // Just select it, don't start drag
      handleSelectOverlay(overlay.id);
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();

    // Track this pointer for pinch detection
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    // Capture pointer so moves keep firing even if pointer leaves element
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    
    handleSelectOverlay(overlay.id);
    
    // Check if this is second pointer (pinch start)
    if (pointersRef.current.size === 2) {
      const pointers = Array.from(pointersRef.current.values());
      const dx = pointers[0].x - pointers[1].x;
      const dy = pointers[0].y - pointers[1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      pinchRef.current = {
        id: overlay.id,
        startDistance: dist,
        startScale: overlay.scale,
      };
      // Clear drag ref since we're now pinching
      dragRef.current = null;
    } else {
      // Single pointer = drag
      dragRef.current = {
        id: overlay.id,
        startX: e.clientX,
        startY: e.clientY,
        originalX: overlay.x,
        originalY: overlay.y,
      };
    }
    
    // Reset snap state
    snappedXRef.current = null;
    snappedYRef.current = null;

    document.addEventListener('pointermove', handlePointerMoveRef.current);
    document.addEventListener('pointerup', handlePointerEndRef.current);
    document.addEventListener('pointercancel', handlePointerEndRef.current);
  }, [isEditable, currentActiveId, handleSelectOverlay]);
  
  // Stable pointer move handler using refs
  const handlePointerMoveStable = useCallback((e: PointerEvent) => {
    // Update pointer position for pinch tracking
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    
    // Handle pinch if we have 2 pointers
    if (pointersRef.current.size === 2 && pinchRef.current && onChangeRef.current) {
      e.preventDefault();
      const pointers = Array.from(pointersRef.current.values());
      const dx = pointers[0].x - pointers[1].x;
      const dy = pointers[0].y - pointers[1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const ratio = dist / pinchRef.current.startDistance;
      const nextScale = clamp(pinchRef.current.startScale * ratio, MIN_SCALE, MAX_SCALE);
      
      const updated = textOverlaysRef.current.map(overlay =>
        overlay.id === pinchRef.current?.id
          ? { ...overlay, scale: nextScale }
          : overlay
      );
      onChangeRef.current(updated);
      return;
    }
    
    if (!dragRef.current || !containerRef?.current || !onChangeRef.current) return;
    e.preventDefault();

    const clientX = e.clientX;
    const clientY = e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (clientX - dragRef.current.startX) / rect.width;
    const deltaY = (clientY - dragRef.current.startY) / rect.height;

    let rawX = dragRef.current.originalX + deltaX;
    let rawY = dragRef.current.originalY + deltaY;
    
    // Apply snapping with hysteresis
    const snapResultX = snapWithHysteresis(rawX, snapTargetsX, snappedXRef.current, SNAP_IN_TOLERANCE, SNAP_OUT_TOLERANCE);
    const snapResultY = snapWithHysteresis(rawY, snapTargetsY, snappedYRef.current, SNAP_IN_TOLERANCE, SNAP_OUT_TOLERANCE);
    
    snappedXRef.current = snapResultX.target;
    snappedYRef.current = snapResultY.target;
    
    // Update guides
    setActiveGuideX(snapResultX.target !== null ? { position: snapResultX.target, type: getGuideType(snapResultX.target) } : null);
    setActiveGuideY(snapResultY.target !== null ? { position: snapResultY.target, type: getGuideType(snapResultY.target) } : null);
    
    // Clamp to safe bounds
    const newX = clamp(snapResultX.snapped, safeBounds.minX, safeBounds.maxX);
    const newY = clamp(snapResultY.snapped, safeBounds.minY, safeBounds.maxY);

    const updated = textOverlaysRef.current.map(overlay =>
      overlay.id === dragRef.current?.id
        ? { ...overlay, x: newX, y: newY }
        : overlay
    );
    onChangeRef.current(updated);
  }, [containerRef, snapTargetsX, snapTargetsY, safeBounds]);
  
  // Store in ref for stable event listener
  const handlePointerMoveRef = useRef(handlePointerMoveStable);
  useEffect(() => { handlePointerMoveRef.current = handlePointerMoveStable; }, [handlePointerMoveStable]);

  const handlePointerEndStable = useCallback((e: PointerEvent) => {
    // Remove pointer from tracking
    pointersRef.current.delete(e.pointerId);
    
    if (pointerIdRef.current !== null) {
      try {
        (e.target as HTMLElement)?.releasePointerCapture(pointerIdRef.current);
      } catch {}
    }
    pointerIdRef.current = null;
    dragRef.current = null;
    pinchRef.current = null;
    snappedXRef.current = null;
    snappedYRef.current = null;
    setActiveGuideX(null);
    setActiveGuideY(null);
    document.removeEventListener('pointermove', handlePointerMoveRef.current);
    document.removeEventListener('pointerup', handlePointerEndRef.current);
    document.removeEventListener('pointercancel', handlePointerEndRef.current);
  }, []);
  
  const handlePointerEndRef = useRef(handlePointerEndStable);
  useEffect(() => { handlePointerEndRef.current = handlePointerEndStable; }, [handlePointerEndStable]);

  // Legacy drag handlers (kept for touch pinch compatibility)
  const handleDragStart = useCallback((
    e: React.TouchEvent | React.MouseEvent,
    overlay: TextOverlay
  ) => {
    if (!isEditable) return;
    
    // Only allow dragging the active overlay
    if (currentActiveId && overlay.id !== currentActiveId) {
      handleSelectOverlay(overlay.id);
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
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
    
    snappedXRef.current = null;
    snappedYRef.current = null;

    if ('touches' in e) {
      document.addEventListener('touchmove', handleDragMove as any, { passive: false });
      document.addEventListener('touchend', handleDragEnd as any);
    }
  }, [isEditable, currentActiveId, handleSelectOverlay]);

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    // Handle pinch if two fingers
    if ('touches' in e && e.touches.length === 2 && pinchRef.current && onChange) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0] as unknown as React.Touch, e.touches[1] as unknown as React.Touch);
      const ratio = dist / pinchRef.current.startDistance;
      const nextScale = clamp(pinchRef.current.startScale * ratio, MIN_SCALE, MAX_SCALE);
      
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

    let rawX = dragRef.current.originalX + deltaX;
    let rawY = dragRef.current.originalY + deltaY;
    
    // Apply snapping with hysteresis
    const snapResultX = snapWithHysteresis(rawX, snapTargetsX, snappedXRef.current, SNAP_IN_TOLERANCE, SNAP_OUT_TOLERANCE);
    const snapResultY = snapWithHysteresis(rawY, snapTargetsY, snappedYRef.current, SNAP_IN_TOLERANCE, SNAP_OUT_TOLERANCE);
    
    snappedXRef.current = snapResultX.target;
    snappedYRef.current = snapResultY.target;
    
    // Update guides
    setActiveGuideX(snapResultX.target !== null ? { position: snapResultX.target, type: getGuideType(snapResultX.target) } : null);
    setActiveGuideY(snapResultY.target !== null ? { position: snapResultY.target, type: getGuideType(snapResultY.target) } : null);
    
    // Clamp to safe bounds
    const newX = clamp(snapResultX.snapped, safeBounds.minX, safeBounds.maxX);
    const newY = clamp(snapResultY.snapped, safeBounds.minY, safeBounds.maxY);

    const updated = textOverlays.map(overlay =>
      overlay.id === dragRef.current?.id
        ? { ...overlay, x: newX, y: newY }
        : overlay
    );
    onChange(updated);
  }, [textOverlays, onChange, containerRef, snapTargetsX, snapTargetsY, safeBounds]);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    pinchRef.current = null;
    snappedXRef.current = null;
    snappedYRef.current = null;
    setActiveGuideX(null);
    setActiveGuideY(null);
    document.removeEventListener('touchmove', handleDragMove as any);
    document.removeEventListener('touchend', handleDragEnd as any);
    document.removeEventListener('mousemove', handleDragMove as any);
    document.removeEventListener('mouseup', handleDragEnd as any);
  }, [handleDragMove]);
  
  // Handle pinch start (two finger touch) — stored as ref for native listener
  const handleTouchStartRef = useRef<(e: TouchEvent, overlay: TextOverlay) => void>(() => {});
  handleTouchStartRef.current = (e: TouchEvent, overlay: TextOverlay) => {
    if (!isEditable) return;
    
    handleSelectOverlay(overlay.id);
    
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      const dist = touchDistance(e.touches[0] as unknown as React.Touch, e.touches[1] as unknown as React.Touch);
      pinchRef.current = {
        id: overlay.id,
        startDistance: dist,
        startScale: overlay.scale,
      };
      
      document.addEventListener('touchmove', handleDragMove as any, { passive: false });
      document.addEventListener('touchend', handleDragEnd as any);
    } else {
      // Synthesise enough of a React-like event for handleDragStart
      e.preventDefault();
      e.stopPropagation();
      handleSelectOverlay(overlay.id);

      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;

      dragRef.current = {
        id: overlay.id,
        startX: clientX,
        startY: clientY,
        originalX: overlay.x,
        originalY: overlay.y,
      };
      
      snappedXRef.current = null;
      snappedYRef.current = null;

      document.addEventListener('touchmove', handleDragMove as any, { passive: false });
      document.addEventListener('touchend', handleDragEnd as any);
    }
  };

  // Ref-callback map for attaching native touchstart with { passive: false }
  const overlayElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const overlayListenersRef = useRef<Map<string, (e: TouchEvent) => void>>(new Map());

  const getOverlayRefCallback = useCallback((overlay: TextOverlay) => (el: HTMLDivElement | null) => {
    const prev = overlayElsRef.current.get(overlay.id);
    const prevListener = overlayListenersRef.current.get(overlay.id);
    // Clean up old listener
    if (prev && prevListener) {
      prev.removeEventListener('touchstart', prevListener);
    }
    if (el && isEditable) {
      const listener = (e: TouchEvent) => handleTouchStartRef.current(e, overlay);
      el.addEventListener('touchstart', listener, { passive: false });
      overlayElsRef.current.set(overlay.id, el);
      overlayListenersRef.current.set(overlay.id, listener);
    } else {
      overlayElsRef.current.delete(overlay.id);
      overlayListenersRef.current.delete(overlay.id);
    }
  }, [isEditable]);
  
  // Rotation handle drag - using pointer events with refs to avoid stale closures
  const rotatePointerIdRef = useRef<number | null>(null);
  
  // Stable rotate move handler
  const handleRotateMoveStable = useCallback((e: PointerEvent) => {
    if (!rotateRef.current || !onChangeRef.current) return;
    e.preventDefault();
    
    const currentAngle = Math.atan2(
      e.clientY - rotateRef.current.centerY, 
      e.clientX - rotateRef.current.centerX
    );
    
    const deltaAngle = currentAngle - rotateRef.current.startAngle;
    const degrees = deltaAngle * (180 / Math.PI);
    let rawRotation = rotateRef.current.startRotation + degrees;
    
    // Normalize to -180..180
    while (rawRotation > 180) rawRotation -= 360;
    while (rawRotation < -180) rawRotation += 360;
    
    // Apply rotation snapping
    const snapResult = snapRotation(rawRotation, snappedRotationRef.current);
    snappedRotationRef.current = snapResult.isSnapped ? snapResult.snapped : null;
    
    // Show rotation label when snapped
    setRotationLabel(snapResult.isSnapped ? Math.round(snapResult.snapped) : null);
    
    const updated = textOverlaysRef.current.map(overlay =>
      overlay.id === rotateRef.current?.id
        ? { ...overlay, rotation: snapResult.snapped }
        : overlay
    );
    onChangeRef.current(updated);
  }, []);
  
  const handleRotateMoveRef = useRef(handleRotateMoveStable);
  useEffect(() => { handleRotateMoveRef.current = handleRotateMoveStable; }, [handleRotateMoveStable]);
  
  // Stable rotate end handler
  const handleRotateEndStable = useCallback((e?: PointerEvent) => {
    if (rotatePointerIdRef.current !== null && e) {
      try {
        (e.target as HTMLElement)?.releasePointerCapture(rotatePointerIdRef.current);
      } catch {}
    }
    rotatePointerIdRef.current = null;
    rotateRef.current = null;
    snappedRotationRef.current = null;
    setRotationLabel(null);
    document.removeEventListener('pointermove', handleRotateMoveRef.current);
    document.removeEventListener('pointerup', handleRotateEndRef.current);
    document.removeEventListener('pointercancel', handleRotateEndRef.current);
  }, []);
  
  const handleRotateEndRef = useRef(handleRotateEndStable);
  useEffect(() => { handleRotateEndRef.current = handleRotateEndStable; }, [handleRotateEndStable]);
  
  const handleRotateStart = useCallback((
    e: React.PointerEvent,
    overlay: TextOverlay
  ) => {
    // Failsafe: always select the overlay even if rotation can't start
    handleSelectOverlay(overlay.id);
    
    if (!isEditable || !containerRef?.current) return;
    e.preventDefault();
    e.stopPropagation();

    // Capture pointer for rotation handle (use currentTarget so SVG clicks still work)
    e.currentTarget.setPointerCapture(e.pointerId);
    rotatePointerIdRef.current = e.pointerId;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + overlay.x * rect.width;
    const centerY = rect.top + overlay.y * rect.height;
    
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
    rotateRef.current = {
      id: overlay.id,
      centerX,
      centerY,
      startAngle,
      startRotation: overlay.rotation ?? 0,
    };
    
    snappedRotationRef.current = null;
    
    document.addEventListener('pointermove', handleRotateMoveRef.current);
    document.addEventListener('pointerup', handleRotateEndRef.current);
    document.addEventListener('pointercancel', handleRotateEndRef.current);
  }, [isEditable, containerRef]);

  if (!textOverlays || textOverlays.length === 0) {
    return null;
  }

  // Render guide line with appropriate styling
  const renderGuideX = (guide: ActiveGuide) => {
    const styleClass = guide.type === 'center' 
      ? 'bg-white/40' 
      : guide.type === 'thirds' 
        ? 'bg-white/30 border-l border-dashed border-white/50' 
        : 'bg-white/20';
    return (
      <div 
        key={`guide-x-${guide.position}`}
        className={cn("absolute top-0 bottom-0 w-px pointer-events-none z-40", styleClass)}
        style={{ 
          left: `${guide.position * 100}%`,
          boxShadow: '0 0 2px rgba(0,0,0,0.5)',
        }}
      />
    );
  };
  
  const renderGuideY = (guide: ActiveGuide) => {
    const styleClass = guide.type === 'center' 
      ? 'bg-white/40' 
      : guide.type === 'thirds' 
        ? 'bg-white/30 border-t border-dashed border-white/50' 
        : 'bg-white/20';
    return (
      <div 
        key={`guide-y-${guide.position}`}
        className={cn("absolute left-0 right-0 h-px pointer-events-none z-40", styleClass)}
        style={{ 
          top: `${guide.position * 100}%`,
          boxShadow: '0 0 2px rgba(0,0,0,0.5)',
        }}
      />
    );
  };

  return (
    <div 
      className="absolute inset-0 overflow-hidden z-30"
      style={{ pointerEvents: isEditable ? 'auto' : 'none' }}
    >
      {/* Snap guides */}
      {isEditable && activeGuideX && renderGuideX(activeGuideX)}
      {isEditable && activeGuideY && renderGuideY(activeGuideY)}
      
      {sortedOverlays.map((overlay, index) => {
        const variant = TEXT_VARIANTS[overlay.style] || TEXT_VARIANTS.modern_bold;
        const textColor = overlay.color || '#FFFFFF';
        const rotation = overlay.rotation ?? 0;
        const scale = overlay.scale;
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
              isEditable && "cursor-move touch-none select-none"
            )}
            style={{
              left: `${overlay.x * 100}%`,
              top: `${overlay.y * 100}%`,
              // Apply scale to entire wrapper so bg/padding scales proportionally
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              zIndex: isActive ? 10 : 5 + index,
              touchAction: isEditable ? 'none' : 'auto',
              pointerEvents: isEditable ? 'auto' : 'none',
            }}
            onPointerDown={isEditable ? (e) => handlePointerDown(e, overlay) : undefined}
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
                fontSize: `${BASE_FONT_SIZE}px`, // Fixed base, scaling via transform
                textShadow,
                WebkitTextStroke: strokeStyle !== 'none' ? strokeStyle : undefined,
                textTransform: variant.textTransform || 'none',
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
                    isActive ? "border-white opacity-90" : "border-white/30 opacity-40"
                  )}
                />
                
                {/* Rotation handle - only show for active overlay */}
                {isActive && (
                  <>
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white/90 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handleRotateStart(e, overlay);
                      }}
                    >
                      <RotateCw className="w-4 h-4 text-zinc-700" />
                    </div>
                    
                    {/* Rotation label when snapped */}
                    {rotationLabel !== null && (
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium whitespace-nowrap">
                        {rotationLabel}°
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
