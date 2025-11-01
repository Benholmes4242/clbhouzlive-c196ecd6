import React from 'react';
import { Globe, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameVisibility } from '../types';

interface GameVisibilityBadgeProps {
  visibility: GameVisibility;
  className?: string;
  size?: 'sm' | 'md';
}

const VISIBILITY_CONFIG: Record<GameVisibility, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  public: {
    label: 'Public',
    icon: Globe,
    className: 'bg-white/[0.08] text-white/70'
  },
  friends: {
    label: 'Friends',
    icon: Users,
    className: 'bg-gradient-to-br from-[#6E9277] to-[#89A78C] text-white'
  },
  club: {
    label: 'Club',
    icon: Building2,
    className: 'bg-gradient-to-br from-[#6E9277] to-[#89A78C] text-white'
  }
};

export function GameVisibilityBadge({ visibility, className, size = 'sm' }: GameVisibilityBadgeProps) {
  const config = VISIBILITY_CONFIG[visibility];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full font-medium",
      size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      config.className,
      className
    )}>
      <Icon className={size === 'sm' ? "h-2.5 w-2.5" : "h-3 w-3"} />
      <span>{config.label}</span>
    </div>
  );
}
