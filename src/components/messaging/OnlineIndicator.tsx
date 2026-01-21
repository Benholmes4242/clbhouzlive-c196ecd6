import { cn } from '@/lib/utils';
import type { PresenceStatus } from '@/hooks/usePresence';
import { formatDistanceToNow } from 'date-fns';

interface OnlineIndicatorProps {
  status: PresenceStatus;
  lastSeenAt?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OnlineIndicator({ 
  status, 
  lastSeenAt, 
  showText = false,
  size = 'sm',
  className,
}: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-muted-foreground/50',
  };

  const getText = () => {
    if (status === 'online') return 'Active now';
    if (status === 'away') return 'Away';
    if (lastSeenAt) {
      try {
        return `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`;
      } catch {
        return 'Offline';
      }
    }
    return 'Offline';
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span 
        className={cn(
          "rounded-full flex-shrink-0",
          sizeClasses[size],
          statusColors[status],
          status === 'online' && "animate-pulse"
        )} 
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {getText()}
        </span>
      )}
    </div>
  );
}
