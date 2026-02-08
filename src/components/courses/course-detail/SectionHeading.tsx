import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  className?: string;
}

/**
 * Shared section heading with amber accent bar.
 * Used across Course Detail About tab for visual consistency.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, className }) => (
  <div className={cn("flex items-center gap-3", className)}>
    <div className="w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent rounded-full" />
    <h2 className="text-lg md:text-xl font-semibold text-foreground">{title}</h2>
  </div>
);

export default SectionHeading;
