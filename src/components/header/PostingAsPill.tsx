import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

interface PostingAsPillProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnread?: boolean;
}

export function PostingAsPill({ onClick, isOpen, hasUnread = false }: PostingAsPillProps) {
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
      {/* Squircle Avatar with notification dot */}
      <div className="relative flex-shrink-0">
        <SquircleAvatar
          size={24}
          src={activeActor.avatarUrl}
          alt={activeActor.name}
          fallback={getInitials(activeActor.name)}
          hideRing
        />
        {hasUnread && (
          <span 
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500 ring-[1.5px] ring-[rgb(10,10,10)]"
            aria-label="Unread notifications"
          />
        )}
      </div>
      
      {/* Name */}
      <span className="text-xs font-medium text-white truncate max-w-[120px]">
        {activeActor.name}
      </span>
      
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
