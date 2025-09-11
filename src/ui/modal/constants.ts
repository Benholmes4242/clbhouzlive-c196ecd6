// Modal constants extracted from ProfileModalRouter implementation
// These values ensure consistent behavior across all slide-in modals

export const MODAL_PANEL_SIZES = {
  // Mobile: full width
  mobileWidth: 'w-full',
  mobileHeight: 'top-0 bottom-0',
  mobilePosition: 'top-0 left-0 right-0 bottom-0',
  
  // Desktop: constrained width, right-aligned
  desktopWidth: 'w-[90vw]',
  desktopMaxWidth: 'max-w-[860px]',
  desktopHeight: 'inset-y-0',
  desktopPosition: 'right-0 inset-y-0',
  desktopBorderRadius: 'rounded-l-2xl',
  
  // Panel styling
  background: 'bg-background',
  shadow: 'shadow-2xl',
  panelZIndex: 'z-10', // Relative to container
} as const;

export const MODAL_ANIMATION = {
  // Slide animation from right
  initialX: '100%',          // Off-screen start position
  animateX: 0,               // On-screen position  
  exitX: '100%',             // Off-screen end position
  
  // Timing and easing (copied exactly from ProfileModalRouter)
  duration: 0.25,            // 0.25 seconds
  type: 'tween' as const,    // Framer Motion tween type
  ease: 'easeInOut' as const, // CSS easing curve
  
  // Overlay animation (no animation in ProfileModalRouter)
  overlayInitial: 1,         // Backdrop appears immediately
  overlayAnimate: 1,         // No fade animation
  overlayExit: 1,            // No fade animation
} as const;

export const MODAL_Z_INDEX = {
  container: 9998,           // Main modal container - higher to prevent background bleed
  panel: 9999,               // Panel within container
  portal: 10000,             // Portal for nested content
} as const;

export const MODAL_OVERLAY = {
  background: 'bg-black/50',  // 50% black opacity
  cursor: 'cursor-default',   // Default cursor
  clickToClose: true,         // Backdrop click closes modal
} as const;

export const MODAL_BEHAVIOUR = {
  closeOnOverlay: true,       // Click backdrop to close
  closeOnEsc: true,           // Escape key to close
  lockScroll: true,           // Lock body scroll when open
  focusTrap: true,            // Basic focus management
  enableSwipeCloseOnMobile: false, // Not implemented in ProfileModalRouter
  
  // Event propagation (from ProfileModalRouter)
  stopMouseDownPropagation: true,
  stopTouchStartPropagation: true,
} as const;

// Responsive breakpoint detection
export const MODAL_RESPONSIVE = {
  mobileBreakpoint: 768,      // px - matches useIsMobile hook
} as const;