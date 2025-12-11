import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

interface PostingAsPillProps {
  onClick: () => void;
  isOpen: boolean;
}

export function PostingAsPill({ onClick, isOpen }: PostingAsPillProps) {
  const { activeActor, isLoading } = useActiveActor();

  if (isLoading || !activeActor) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-sq-pill bg-white/5 border border-white/10">
        <div className="h-6 w-6 bg-white/10 animate-pulse" style={{ borderRadius: '34%' }} />
        <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5",
        "rounded-sq-pill bg-white/5 border border-white/10",
        "hover:bg-white/10 active:bg-white/15 transition-colors",
        "max-w-[200px]"
      )}
    >
      {/* Squircle Avatar */}
      <SquircleAvatar
        size={24}
        src={activeActor.avatarUrl}
        alt={activeActor.name}
        fallback={getInitials(activeActor.name)}
        hideRing
        className="flex-shrink-0"
      />
      
      {/* Label and name */}
      <div className="flex flex-col items-start leading-tight min-w-0">
        <span className="text-[9px] uppercase tracking-wide text-white/50">
          Posting as
        </span>
        <span className="text-xs font-medium text-white truncate max-w-[120px]">
          {activeActor.name}
        </span>
      </div>
      
      {/* Chevron */}
      <ChevronDown 
        className={cn(
          "h-3 w-3 text-white/50 flex-shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} 
      />
    </button>
  );
}
