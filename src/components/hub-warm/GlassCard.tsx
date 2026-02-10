/**
 * GlassCard — Glassmorphism card component
 * Semi-transparent white with backdrop blur
 * Spec: bg rgba(255,255,255,0.65), blur(20px), radius 20px
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function GlassCard({ children, className = '', onClick, style = {} }: GlassCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={cn('warm-glass-card', className)}
      onClick={onClick}
      style={style}
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {children}
    </Component>
  );
}
