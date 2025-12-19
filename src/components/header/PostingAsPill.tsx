import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

interface PostingAsPillProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnread?: boolean;
  useLightTheme?: boolean;
}

// Light theme colors
const LIGHT = {
  bg: '#FFFFFF',
  bgHover: '#F5F6F7',
  bgActive: '#EDEFF2',
  border: '#E4E7EB',
  text: '#1F2428',
  textMuted: '#5A6270',
  skeleton: '#E4E7EB',
};

export function PostingAsPill({ onClick, isOpen, hasUnread = false, useLightTheme = false }: PostingAsPillProps) {
  const { activeActor, isLoading } = useActiveActor();

  if (isLoading || !activeActor) {
    return (
      <div 
        className="flex items-center gap-2 px-2 py-1.5 rounded-sq-pill"
        style={{
          background: useLightTheme ? LIGHT.bg : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${useLightTheme ? LIGHT.border : 'rgba(255, 255, 255, 0.1)'}`,
        }}
      >
        <div 
          className="h-7 w-7 animate-pulse" 
          style={{ 
            borderRadius: '34%',
            background: useLightTheme ? LIGHT.skeleton : 'rgba(255, 255, 255, 0.1)',
          }} 
        />
        <div 
          className="h-3 w-16 rounded animate-pulse"
          style={{ background: useLightTheme ? LIGHT.skeleton : 'rgba(255, 255, 255, 0.1)' }}
        />
      </div>
    );
  }

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 pl-1.5 pr-2.5 py-1",
        "rounded-sq-pill transition-colors",
        "max-w-[200px]"
      )}
      style={{
        background: useLightTheme ? LIGHT.bg : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${useLightTheme ? LIGHT.border : 'rgba(255, 255, 255, 0.1)'}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = useLightTheme ? LIGHT.bgHover : 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = useLightTheme ? LIGHT.bg : 'rgba(255, 255, 255, 0.05)';
      }}
    >
      {/* Squircle Avatar with notification dot */}
      <div className="relative flex-shrink-0 flex items-center">
        <SquircleAvatar
          size={28}
          src={activeActor.avatarUrl}
          alt={activeActor.name}
          fallback={getInitials(activeActor.name)}
          hideRing
        />
        {hasUnread && (
          <span 
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500"
            style={{ 
              boxShadow: useLightTheme 
                ? `0 0 0 1.5px ${LIGHT.bg}` 
                : '0 0 0 1.5px rgb(10, 10, 10)' 
            }}
            aria-label="Unread notifications"
          />
        )}
      </div>
      
      {/* Name */}
      <span 
        className="text-xs font-medium truncate max-w-[120px] leading-none"
        style={{ color: useLightTheme ? LIGHT.text : 'white' }}
      >
        {activeActor.name}
      </span>
      
      {/* Chevron */}
      <ChevronDown 
        className={cn(
          "h-3 w-3 flex-shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
        style={{ color: useLightTheme ? LIGHT.textMuted : 'rgba(255, 255, 255, 0.5)' }}
      />
    </button>
  );
}

export default PostingAsPill;
