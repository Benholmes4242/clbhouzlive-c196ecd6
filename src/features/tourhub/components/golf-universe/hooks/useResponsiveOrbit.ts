/**
 * useResponsiveOrbit - Responsive sizing hook for MomentumOrbit
 * Replaces brittle window.innerWidth checks with proper resize handling
 */

import { useState, useEffect } from 'react';

interface OrbitSizes {
  orbitRadius: number;
  centerSize: number;
  nodeSize: number;
  containerHeight: number;
}

const BREAKPOINTS = {
  mobile: 400,
  tablet: 640,
} as const;

const SIZES = {
  mobile: {
    orbitRadius: 80,
    centerSize: 52,
    nodeSize: 36,
    containerHeight: 240,
  },
  tablet: {
    orbitRadius: 95,
    centerSize: 60,
    nodeSize: 40,
    containerHeight: 260,
  },
  desktop: {
    orbitRadius: 110,
    centerSize: 68,
    nodeSize: 44,
    containerHeight: 300,
  },
} as const;

function getSizes(width: number): OrbitSizes {
  if (width < BREAKPOINTS.mobile) {
    return SIZES.mobile;
  }
  if (width < BREAKPOINTS.tablet) {
    return SIZES.tablet;
  }
  return SIZES.desktop;
}

export function useResponsiveOrbit(): OrbitSizes {
  const [sizes, setSizes] = useState<OrbitSizes>(() => {
    if (typeof window === 'undefined') return SIZES.desktop;
    return getSizes(window.innerWidth);
  });

  useEffect(() => {
    function handleResize() {
      setSizes(getSizes(window.innerWidth));
    }

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return sizes;
}
