/**
 * ImmersiveLayout - Unified component for full-bleed immersive layouts
 * 
 * Consolidates three patterns:
 * 1. Hero Bleed - Content extends behind header/safe area (e.g., Course Details)
 * 2. Video Feed - Full viewport with custom header/footer (e.g., Clubhouse)
 * 3. Overlay - Fixed fullscreen modal (e.g., Media Viewer, Lightbox)
 * 
 * @see /docs/immersive-layouts.md for usage examples
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useImmersiveHeader } from '@/hooks/useImmersiveHeader';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { usePreventOverscroll } from '@/hooks/usePreventOverscroll';
import { SAFE_AREA, safeAreaStyles } from '@/constants/safeArea';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export type ImmersiveVariant = 'hero-bleed' | 'video-feed' | 'overlay';
export type StatusBarStyle = 'light' | 'dark' | 'auto';

export interface ImmersiveLayoutProps {
  /** Layout variant */
  variant: ImmersiveVariant;
  /** Main content */
  children: React.ReactNode;
  
  // ═══════════════════════════════════════════
  // Hero Bleed Options
  // ═══════════════════════════════════════════
  /** Hero height (default: '72dvh') */
  heroHeight?: string;
  /** Hero min height in pixels (default: 420) */
  heroMinHeight?: number;
  /** Hero max height in pixels (default: 600) */
  heroMaxHeight?: number;
  /** Whether page has a 55px header above hero (default: true) */
  hasHeader?: boolean;
  
  // ═══════════════════════════════════════════
  // Video Feed Options
  // ═══════════════════════════════════════════
  /** Custom header for video feeds */
  header?: React.ReactNode;
  /** Bottom UI (captions, controls) */
  footer?: React.ReactNode;
  /** Right-side engagement buttons */
  engagementSidebar?: React.ReactNode;
  
  // ═══════════════════════════════════════════
  // Overlay Options
  // ═══════════════════════════════════════════
  /** Whether overlay is visible (for portal rendering) */
  isOpen?: boolean;
  /** Z-index (default: 9999) */
  zIndex?: number;
  /** Close handler */
  onClose?: () => void;
  /** Whether to show close button (default: true for overlay) */
  showCloseButton?: boolean;
  /** Close button position */
  closeButtonPosition?: 'left' | 'right';
  /** Custom close button element */
  closeButton?: React.ReactNode;
  /** Whether to render via portal (default: true for overlay) */
  usePortal?: boolean;
  
  // ═══════════════════════════════════════════
  // Shared Options
  // ═══════════════════════════════════════════
  /** Status bar style (default: 'light' for hero, 'dark' for overlay/video) */
  statusBarStyle?: StatusBarStyle;
  /** Status bar background color */
  statusBarColor?: string;
  /** Background color (default: 'bg-black' for overlay/video, none for hero) */
  backgroundColor?: string;
  /** Additional className */
  className?: string;
  /** Prevent overscroll bounce (default: true for video-feed) */
  preventOverscroll?: boolean;
}


// ============================================
// COMPONENT
// ============================================

export const ImmersiveLayout: React.FC<ImmersiveLayoutProps> = ({
  variant,
  children,
  
  // Hero options
  heroHeight = '72dvh',
  heroMinHeight = 420,
  heroMaxHeight = 600,
  hasHeader = true,
  
  // Video feed options
  header,
  footer,
  engagementSidebar,
  
  // Overlay options
  isOpen = true,
  zIndex = 9999,
  onClose,
  showCloseButton = variant === 'overlay',
  closeButtonPosition = 'left',
  closeButton,
  usePortal = variant === 'overlay',
  
  // Shared options
  statusBarStyle: statusBarStyleProp,
  statusBarColor,
  backgroundColor,
  className,
  preventOverscroll: preventOverscrollProp,
}) => {
  // Derive defaults based on variant
  const statusBarStyle = statusBarStyleProp ?? (variant === 'hero-bleed' ? 'light' : 'dark');
  const bgColor = backgroundColor ?? (variant === 'hero-bleed' ? undefined : 'bg-black');
  const shouldPreventOverscroll = preventOverscrollProp ?? variant === 'video-feed';
  
  // Determine status bar color
  const resolvedStatusBarColor = statusBarColor ?? (variant === 'overlay' ? 'transparent' : '#000000');
  
  // ═══════════════════════════════════════════════════════════════
  // HOOKS
  // ═══════════════════════════════════════════════════════════════
  
  // Hide global header for video feeds
  useImmersiveHeader(variant === 'video-feed' && isOpen);
  
  // Set status bar appearance
  useMedianStatusBar(
    statusBarStyle,
    resolvedStatusBarColor,
    variant === 'overlay', // overlay mode
    false, // blur
    isOpen // enabled
  );
  
  // Prevent overscroll for video feeds
  usePreventOverscroll();
  
  // Lock body scroll for overlays
  useEffect(() => {
    if (variant !== 'overlay' || !isOpen) return;
    
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [variant, isOpen]);
  
  // Escape key handler for overlays
  useEffect(() => {
    if (variant !== 'overlay' || !isOpen || !onClose) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [variant, isOpen, onClose]);
  
  // Browser back button handling for overlays
  useEffect(() => {
    if (variant !== 'overlay' || !isOpen || !onClose) return;
    
    window.history.pushState({ immersiveOverlay: true }, '');
    
    const handlePopState = () => {
      onClose();
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [variant, isOpen, onClose]);
  

  // ═══════════════════════════════════════════════════════════════
  // PATTERN A: Hero Bleed
  // ═══════════════════════════════════════════════════════════════
  if (variant === 'hero-bleed') {
    const headerOffset = hasHeader ? SAFE_AREA.HEADER_HEIGHT : '0px';
    
    const heroStyles: React.CSSProperties = {
      height: `calc(${heroHeight} + ${headerOffset} + ${SAFE_AREA.TOP})`,
      minHeight: `calc(${heroMinHeight}px + ${headerOffset} + ${SAFE_AREA.TOP})`,
      maxHeight: `calc(${heroMaxHeight}px + ${headerOffset} + ${SAFE_AREA.TOP})`,
      marginTop: `calc(-${headerOffset} - ${SAFE_AREA.TOP})`,
    };
    
    return (
      <div 
        className={cn('relative', className)}
        style={heroStyles}
      >
        {children}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PATTERN B: Video Feed
  // ═══════════════════════════════════════════════════════════════
  if (variant === 'video-feed') {
    return (
      <div className={cn('fixed inset-0', bgColor, className)}>
        {/* Background content - full bleed */}
        <div className="absolute inset-0">
          {children}
        </div>
        
        {/* Header - respects TOP safe area */}
        {header && (
          <div 
            className="absolute top-0 left-0 right-0 z-50 pointer-events-none"
            style={{ paddingTop: SAFE_AREA.TOP }}
          >
            <div className="pointer-events-auto">
              {header}
            </div>
          </div>
        )}
        
        {/* Engagement sidebar - respects both safe areas */}
        {engagementSidebar && (
          <div 
            className="absolute right-0 z-50 flex flex-col justify-end pointer-events-none"
            style={{ 
              top: `calc(${SAFE_AREA.TOP} + 60px)`,
              bottom: `calc(${SAFE_AREA.BOTTOM} + 80px)`,
              paddingRight: '12px',
            }}
          >
            <div className="pointer-events-auto">
              {engagementSidebar}
            </div>
          </div>
        )}
        
        {/* Footer - respects BOTTOM safe area */}
        {footer && (
          <div 
            className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none"
            style={{ paddingBottom: SAFE_AREA.BOTTOM }}
          >
            <div className="pointer-events-auto">
              {footer}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PATTERN C: Fixed Overlay
  // ═══════════════════════════════════════════════════════════════
  if (variant === 'overlay') {
    // Don't render if not open
    if (!isOpen) return null;
    
    const content = (
      <div 
        className={cn('fixed inset-0', bgColor, className)}
        style={{ zIndex }}
      >
        {/* Close button */}
        {showCloseButton && onClose && (
          closeButton || (
            <button
              onClick={onClose}
              className={cn(
                'absolute z-[10001] w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm',
                'flex items-center justify-center text-white/80 hover:text-white transition-colors',
                closeButtonPosition === 'left' ? 'left-4' : 'right-4'
              )}
              style={{ top: `calc(${SAFE_AREA.TOP} + 16px)` }}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )
        )}
        
        {/* Content */}
        <div className="absolute inset-0">
          {children}
        </div>
        
        {/* Footer - respects BOTTOM safe area */}
        {footer && (
          <div 
            className="absolute bottom-0 left-0 right-0"
            style={{ paddingBottom: SAFE_AREA.BOTTOM }}
          >
            {footer}
          </div>
        )}
      </div>
    );
    
    // Render via portal if requested
    if (usePortal) {
      return createPortal(content, document.body);
    }
    
    return content;
  }

  // Fallback - should never reach
  return null;
};

export default ImmersiveLayout;
