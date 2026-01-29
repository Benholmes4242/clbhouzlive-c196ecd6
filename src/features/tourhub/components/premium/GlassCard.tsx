import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  hover?: boolean;
  className?: string;
}

/**
 * Premium glassmorphism card for Tour Hub
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = 'default', hover = true, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'th-glass rounded-3xl',
          variant === 'elevated' && 'shadow-[var(--th-shadow-elevated)]',
          variant === 'subtle' && 'bg-white/5 border-white/8',
          hover && 'th-glass-hover transition-all duration-300',
          className
        )}
        whileHover={hover ? { scale: 1.01 } : undefined}
        whileTap={hover ? { scale: 0.99 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
