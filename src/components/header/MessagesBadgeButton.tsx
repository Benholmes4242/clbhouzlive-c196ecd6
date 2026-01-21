import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMessaging } from '@/hooks/useMessaging';
import { cn } from '@/lib/utils';

interface MessagesBadgeButtonProps {
  useLightTheme?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
}

export function MessagesBadgeButton({ 
  useLightTheme = false, 
  isDimmed = false,
  onClick 
}: MessagesBadgeButtonProps) {
  const navigate = useNavigate();
  const { getTotalUnreadCount } = useMessaging();
  
  const unreadCount = getTotalUnreadCount();

  const handleClick = () => {
    onClick?.();
    navigate('/messages');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all",
        "h-9 w-9",
        useLightTheme
          ? isDimmed 
            ? "text-slate-600 hover:text-slate-800 hover:bg-slate-50/30"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          : isDimmed 
            ? "hover:bg-[hsl(var(--clubhouse-hover-bg))]" 
            : "hover:bg-[hsl(var(--clubhouse-active-bg))]"
      )}
      style={{ 
        color: useLightTheme 
          ? undefined 
          : isDimmed 
            ? 'hsl(var(--clubhouse-text-dimmed))' 
            : 'hsl(var(--clubhouse-text-muted))',
        transition: 'all var(--motion-fast) var(--ease-standard)'
      }}
      onClick={handleClick}
      aria-label={`Messages${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
    >
      <MessageCircle className="h-5 w-5" />
      
      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
