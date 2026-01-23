import React from 'react';
import { cn } from '@/lib/utils';
import { PodiumMode } from '@/types/podium';

interface PodiumNarrativeProps {
  text: string;
  mode: PodiumMode;
  isFirst?: boolean;
}

export const PodiumNarrative: React.FC<PodiumNarrativeProps> = ({
  text,
  mode,
  isFirst = false,
}) => {
  return (
    <p
      className={cn(
        'mt-1 text-center truncate w-full',
        isFirst ? 'text-xs' : 'text-[10px]',
        mode === 'seasonal' 
          ? 'text-muted-foreground' 
          : 'text-muted-foreground/80 italic'
      )}
    >
      {text}
    </p>
  );
};
