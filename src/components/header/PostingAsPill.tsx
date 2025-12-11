import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
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
        <div className="h-6 w-6 rounded-full bg-white/10 animate-pulse" />
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
      {/* Avatar */}
      {activeActor.avatarUrl ? (
        <img
          src={activeActor.avatarUrl}
          alt={activeActor.name}
          className="h-6 w-6 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0">
          {getInitials(activeActor.name)}
        </div>
      )}
      
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
