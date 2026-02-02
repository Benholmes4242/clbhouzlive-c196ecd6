import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CaddiePickBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function CaddiePickBadge({ className, size = 'sm' }: CaddiePickBadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full",
        "bg-gradient-to-r from-amber-500/20 to-yellow-500/20",
        "border border-amber-500/30",
        size === 'sm' 
          ? "px-2 py-0.5 text-[10px]" 
          : "px-2.5 py-1 text-xs",
        "text-amber-600 dark:text-amber-400",
        className
      )}
    >
      <span className="text-[11px]">🏌️</span>
      <span className="tracking-wide uppercase">
        Caddie's Pick
      </span>
    </motion.span>
  );
}
