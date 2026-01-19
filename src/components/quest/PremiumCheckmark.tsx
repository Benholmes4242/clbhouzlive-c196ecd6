/**
 * PremiumCheckmark - Gold gradient medal-style checkmark
 * Premium achievement indicator with white ring and gold gradient
 */

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-8 h-8',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const PremiumCheckmark: React.FC<PremiumCheckmarkProps> = ({
  size = 'md',
  className,
}) => (
  <div
    className={cn(
      sizes[size],
      'rounded-full',
      'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600',
      'shadow-lg shadow-amber-500/25',
      'ring-2 ring-white',
      'flex items-center justify-center',
      className
    )}
  >
    <Check
      className={cn(iconSizes[size], 'text-white drop-shadow-sm')}
      strokeWidth={3}
    />
  </div>
);

export default PremiumCheckmark;
