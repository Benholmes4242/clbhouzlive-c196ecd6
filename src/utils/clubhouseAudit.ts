/**
 * Clubhouse Auto-Hide Chrome Audit Instrumentation
 * 
 * Temporary telemetry to validate architecture before implementing auto-hide.
 * Enable via: localStorage.setItem('AUDIT_CLUBHOUSE', 'true')
 */

const AUDIT_ENABLED = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('AUDIT_CLUBHOUSE') === 'true';
};

interface ScrollMetrics {
  scrollTop: number;
  deltaY: number;
  velocity: number;
  direction: 'up' | 'down' | 'idle';
  timestamp: number;
}

interface ComputedStyleAudit {
  element: string;
  position: string;
  zIndex: string;
  height: string;
  backdropFilter: string;
  transform: string;
  willChange: string;
  hasOwnLayer: boolean;
}

/**
 * 1. DOM & Styling Audit
 */
export function auditElementStyles(element: HTMLElement | null, label: string): ComputedStyleAudit | null {
  if (!AUDIT_ENABLED() || !element) return null;

  const computed = getComputedStyle(element);
  const hasOwnLayer = computed.transform !== 'none' || 
                      computed.willChange.includes('transform') ||
                      computed.backfaceVisibility === 'hidden';

  const audit: ComputedStyleAudit = {
    element: label,
    position: computed.position,
    zIndex: computed.zIndex,
    height: computed.height,
    backdropFilter: computed.backdropFilter || 'none',
    transform: computed.transform,
    willChange: computed.willChange,
    hasOwnLayer
  };

  console.log(`[audit:clubhouse] ${label} styles:`, audit);
  return audit;
}

/**
 * 2. Scroll Source & Listeners Audit
 */
export function auditScrollContainer(element: HTMLElement | null, label: string) {
  if (!AUDIT_ENABLED() || !element) return;

  const listeners = {
    scroll: [],
    wheel: [],
    touchstart: [],
    touchmove: [],
    touchend: []
  };

  // Note: Can't directly inspect event listeners, but we can check properties
  const overflowY = getComputedStyle(element).overflowY;
  const overscrollBehavior = getComputedStyle(element).overscrollBehavior;
  const touchAction = getComputedStyle(element).touchAction;
  const webkitOverflowScrolling = (element.style as any).webkitOverflowScrolling;

  console.log(`[audit:clubhouse] ${label} scroll container:`, {
    overflowY,
    overscrollBehavior,
    touchAction,
    webkitOverflowScrolling,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    scrollTop: element.scrollTop
  });
}

/**
 * 3. Safe-Area & Layout Variables Audit
 */
export function auditSafeAreaVars() {
  if (!AUDIT_ENABLED()) return;

  const root = document.documentElement;
  const computed = getComputedStyle(root);

  const vars = {
    '--safe-top': computed.getPropertyValue('--safe-top').trim(),
    '--safe-bottom': computed.getPropertyValue('--safe-bottom').trim(),
    '--safe-left': computed.getPropertyValue('--safe-left').trim(),
    '--safe-right': computed.getPropertyValue('--safe-right').trim(),
    '--header-h-mobile': computed.getPropertyValue('--header-h-mobile').trim(),
    '--header-h-desktop': computed.getPropertyValue('--header-h-desktop').trim(),
    '--nav-height': computed.getPropertyValue('--nav-height').trim(),
    '--bottom-nav-height': computed.getPropertyValue('--bottom-nav-height').trim(),
  };

  console.log('[audit:clubhouse] CSS variables:', vars);
  console.log('[audit:clubhouse] viewport:', {
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    visualViewport: window.visualViewport ? {
      height: window.visualViewport.height,
      width: window.visualViewport.width,
      offsetTop: window.visualViewport.offsetTop,
      scale: window.visualViewport.scale
    } : 'not supported'
  });

  return vars;
}

/**
 * 4. Scroll Velocity & Direction Tracking
 */
let scrollHistory: ScrollMetrics[] = [];
const SCROLL_HISTORY_MAX = 10;

export function trackScrollMetrics(scrollTop: number, timestamp: number = Date.now()): ScrollMetrics | null {
  if (!AUDIT_ENABLED()) return null;

  const lastMetric = scrollHistory[scrollHistory.length - 1];
  const deltaY = lastMetric ? scrollTop - lastMetric.scrollTop : 0;
  const deltaTime = lastMetric ? timestamp - lastMetric.timestamp : 0;
  const velocity = deltaTime > 0 ? deltaY / deltaTime : 0; // px per ms

  const direction: 'up' | 'down' | 'idle' = deltaY > 2 ? 'down' : deltaY < -2 ? 'up' : 'idle';

  const metric: ScrollMetrics = {
    scrollTop,
    deltaY,
    velocity,
    direction,
    timestamp
  };

  scrollHistory.push(metric);
  if (scrollHistory.length > SCROLL_HISTORY_MAX) {
    scrollHistory.shift();
  }

  // Log only on direction changes or significant velocity
  if (direction !== 'idle' && (Math.abs(velocity) > 0.5 || direction !== lastMetric?.direction)) {
    console.log('[audit:clubhouse] scroll:', {
      scrollTop: Math.round(scrollTop),
      deltaY: Math.round(deltaY),
      velocity: velocity.toFixed(2) + ' px/ms',
      direction,
      avgVelocity: getAverageVelocity().toFixed(2) + ' px/ms'
    });
  }

  return metric;
}

function getAverageVelocity(): number {
  if (scrollHistory.length < 2) return 0;
  const recent = scrollHistory.slice(-5);
  const sum = recent.reduce((acc, m) => acc + Math.abs(m.velocity), 0);
  return sum / recent.length;
}

export function resetScrollMetrics() {
  scrollHistory = [];
}

/**
 * 5. IntersectionObserver Telemetry
 */
export function auditIntersectionObserver(
  observer: IntersectionObserver | null,
  label: string
) {
  if (!AUDIT_ENABLED() || !observer) return;

  // Extract config from observer (limited access)
  console.log(`[audit:clubhouse] ${label} observer created`, {
    // Note: Can't access private properties, but we know the config from code
    label,
    timestamp: Date.now()
  });
}

export function logIntersectionEvent(
  label: string,
  postId: string,
  isIntersecting: boolean,
  intersectionRatio: number
) {
  if (!AUDIT_ENABLED()) return;

  console.log(`[audit:clubhouse] ${label} intersection:`, {
    postId: postId.substring(0, 8),
    isIntersecting,
    ratio: intersectionRatio.toFixed(2),
    timestamp: Date.now()
  });
}

/**
 * 6. Performance Marks & Measures
 */
export function markPerformance(name: string) {
  if (!AUDIT_ENABLED()) return;
  
  try {
    performance.mark(`clubhouse:${name}`);
    console.log(`[audit:clubhouse] 🏁 ${name}`);
  } catch (e) {
    // Performance API not available
  }
}

export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (!AUDIT_ENABLED()) return;

  try {
    performance.measure(
      `clubhouse:${name}`,
      `clubhouse:${startMark}`,
      `clubhouse:${endMark}`
    );
    const measure = performance.getEntriesByName(`clubhouse:${name}`)[0];
    if (measure) {
      console.log(`[audit:clubhouse] ⏱️  ${name}: ${measure.duration.toFixed(2)}ms`);
    }
  } catch (e) {
    // Marks don't exist
  }
}

/**
 * 7. Layer Promotion Check
 */
export function checkLayerPromotion(element: HTMLElement | null, label: string) {
  if (!AUDIT_ENABLED() || !element) return;

  const computed = getComputedStyle(element);
  const indicators = {
    transform: computed.transform !== 'none',
    willChange: computed.willChange !== 'auto',
    backfaceVisibility: computed.backfaceVisibility === 'hidden',
    perspective: computed.perspective !== 'none',
    hasBackdropFilter: computed.backdropFilter !== 'none'
  };

  const hasOwnLayer = indicators.transform || indicators.willChange || 
                      indicators.backfaceVisibility || indicators.perspective;

  console.log(`[audit:clubhouse] ${label} layer promotion:`, {
    ...indicators,
    hasOwnLayer,
    likelyComposited: hasOwnLayer,
    warning: indicators.hasBackdropFilter && !hasOwnLayer ? 
      'backdrop-filter without layer promotion may hurt performance' : null
  });
}

/**
 * 8. Accessibility Audit
 */
export function auditAccessibility(element: HTMLElement | null, label: string) {
  if (!AUDIT_ENABLED() || !element) return;

  const computed = getComputedStyle(element);
  const isVisuallyHidden = computed.opacity === '0' || 
                           computed.visibility === 'hidden' ||
                           computed.display === 'none';

  console.log(`[audit:clubhouse] ${label} a11y:`, {
    ariaHidden: element.getAttribute('aria-hidden'),
    tabIndex: element.getAttribute('tabindex'),
    display: computed.display,
    opacity: computed.opacity,
    visibility: computed.visibility,
    isVisuallyHidden,
    inDOM: document.body.contains(element),
    warning: isVisuallyHidden && element.getAttribute('aria-hidden') !== 'true' ?
      'Element is visually hidden but not aria-hidden' : null
  });
}

/**
 * 9. Comprehensive Mount Audit
 */
export function auditComponentMount(
  element: HTMLElement | null,
  label: string,
  options: {
    checkScroll?: boolean;
    checkLayers?: boolean;
    checkA11y?: boolean;
  } = {}
) {
  if (!AUDIT_ENABLED() || !element) return;

  console.group(`[audit:clubhouse] 🔍 ${label} mounted`);
  
  auditElementStyles(element, label);
  
  if (options.checkScroll) {
    auditScrollContainer(element, label);
  }
  
  if (options.checkLayers) {
    checkLayerPromotion(element, label);
  }
  
  if (options.checkA11y) {
    auditAccessibility(element, label);
  }

  console.groupEnd();
  markPerformance(`${label}-mount`);
}

/**
 * 10. Enable/Disable Helpers
 */
export function enableAudit() {
  localStorage.setItem('AUDIT_CLUBHOUSE', 'true');
  console.log('%c[audit:clubhouse] Audit mode enabled. Reload page to see telemetry.', 'color: #00ff00; font-weight: bold');
}

export function disableAudit() {
  localStorage.removeItem('AUDIT_CLUBHOUSE');
  console.log('[audit:clubhouse] Audit mode disabled.');
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).clubhouseAudit = {
    enable: enableAudit,
    disable: disableAudit,
    isEnabled: AUDIT_ENABLED
  };
}
