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
      <div className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full bg-white/5 border border-white/8">
        <div className="h-7 w-7 bg-white/10 animate-pulse" style={{ borderRadius: '34%' }} />
        <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 pl-1.5 pr-2 py-1",
        "rounded-full bg-white/5 border border-white/8",
        "hover:bg-white/10 active:bg-white/15 active:scale-[0.98] transition-all",
        "shadow-sm"
      )}
      aria-label="Open account menu"
    >
      {/* Avatar with notification dot */}
      <div className="relative">
        <SquircleAvatar
          size={28}
          src={activeActor.avatarUrl}
          alt={activeActor.name}
          fallback={getInitials(activeActor.name)}
          hideRing
        />
        {/* Unread notification dot */}
        {hasUnread && (
          <span 
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-[rgb(10,10,10)]"
            aria-label="Unread notifications"
          />
        )}
      </div>
      
      {/* Name */}
      <span className="text-xs font-medium text-white truncate max-w-[90px]">
        {activeActor.name}
      </span>
      
      {/* Chevron */}
      <ChevronDown 
        className={cn(
          "h-4 w-4 text-white/70 flex-shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} 
      />
    </button>
  );
}
