/**
 * WarmGradientBg — Animated warm gradient background
 * Three-layer: base gradient + 2 animated blobs
 * CSS-only animations for GPU performance
 */

import React from 'react';

interface WarmGradientBgProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function WarmGradientBg({ children, className = '', style = {} }: WarmGradientBgProps) {
  return (
    <>
      <div className={`warm-gradient-bg ${className}`} style={style} aria-hidden="true" />
      {children}
    </>
  );
}
