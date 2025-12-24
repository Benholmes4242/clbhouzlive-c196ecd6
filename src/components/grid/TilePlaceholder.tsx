/**
 * TilePlaceholder - Loading placeholder for lazy-loaded tiles
 * 
 * Animated skeleton that registers with viewport tracking
 * for lazy loading observation.
 */

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TilePlaceholderProps {
  index: number;
  variant: 'portrait' | 'landscape';
  registerTile: (index: number, element: HTMLElement | null) => void;
  className?: string;
}

export function TilePlaceholder({
  index,
  variant,
  registerTile,
  className,
}: TilePlaceholderProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = ref.current;
    if (el) {
      registerTile(index, el);
    }
    return () => {
      registerTile(index, null);
    };
  }, [index, registerTile]);
  
  const aspectClass = variant === 'landscape' ? 'aspect-video' : 'aspect-[3/4]';
  
  return (
    <motion.div
      ref={ref}
      className={cn(
        aspectClass,
        'relative overflow-hidden',
        variant === 'landscape' && 'col-span-2',
        className
      )}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 bg-muted/30" />
    </motion.div>
  );
}
