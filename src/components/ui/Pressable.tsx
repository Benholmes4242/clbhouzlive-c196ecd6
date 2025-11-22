/**
 * Pressable - Standardized press/hover utility component
 * Provides consistent micro-interactions across all tappable elements
 * Uses only design system motion tokens
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PressableProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const Pressable = React.forwardRef<HTMLDivElement, PressableProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const Comp: any = asChild ? React.Children.only(children) : 'div';
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          // Base transition using motion tokens
          'transition-transform duration-motion-fast ease-standard',
          // Hover + active states
          'hover:scale-[1.02] active:scale-[0.97]',
          // Respect prefers-reduced-motion
          'motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
          (children as React.ReactElement<any>).props.className
        ),
      });
    }

    return (
      <Comp
        ref={ref}
        className={cn(
          'transition-transform duration-motion-fast ease-standard',
          'hover:scale-[1.02] active:scale-[0.97]',
          'motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Pressable.displayName = 'Pressable';
