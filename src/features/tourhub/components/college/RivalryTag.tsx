/**
 * RivalryTag - Shows rivalry relationship between colleges
 * Tappable to open head-to-head comparison
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Swords } from 'lucide-react';

interface RivalryTagProps {
  rivalName: string;
  onPress?: () => void;
  className?: string;
}

export const RivalryTag: React.FC<RivalryTagProps> = ({
  rivalName,
  onPress,
  className,
}) => {
  const Tag = onPress ? 'button' : 'span';

  return (
    <Tag
      onClick={onPress}
      className={cn(
        'inline-flex items-center gap-1 rounded-sq-pill',
        'px-2 py-0.5 text-[10px] font-semibold',
        'bg-brand-orange/10 text-brand-orange',
        'border border-brand-orange/20',
        onPress && 'hover:bg-brand-orange/15 active:scale-[0.98] transition-all cursor-pointer',
        className
      )}
    >
      <Swords className="w-2.5 h-2.5" />
      <span>vs {rivalName}</span>
    </Tag>
  );
};

export default RivalryTag;
