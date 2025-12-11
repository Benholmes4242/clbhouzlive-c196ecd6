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
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-white/5 border border-white/8">
        <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
        <div className="h-3 w-12 rounded bg-white/10 animate-pulse hidden sm:block" />
      </div>
    );
  }

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 pl-1 pr-2 py-1",
        "rounded-full bg-white/5 border border-white/8",
        "hover:bg-white/10 active:scale-[0.98] transition-all duration-150",
        "min-w-0"
      )}
    >
      {/* Squircle Avatar with notification dot */}
      <div className="relative flex-shrink-0">
        <SquircleAvatar
          size={32}
          src={activeActor.avatarUrl}
          alt={activeActor.name}
          fallback={getInitials(activeActor.name)}
          hideRing
        />
        {hasUnread && (
          <span 
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-[rgb(10,10,10)]"
            aria-label="Unread notifications"
          />
        )}
      </div>
      
      {/* Chevron */}
      <ChevronDown 
        className={cn(
          "h-4 w-4 text-white/50 flex-shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} 
      />
    </button>
  );
}

export default PostingAsPill;
