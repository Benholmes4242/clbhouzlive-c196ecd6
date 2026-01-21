import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMessaging } from '@/hooks/useMessaging';
import { cn } from '@/lib/utils';

interface MessagesBadgeButtonProps {
  className?: string;
  useLightTheme?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
}

export function MessagesBadgeButton({ 
  className,
  useLightTheme = false,
  isDimmed = false,
  onClick,
}: MessagesBadgeButtonProps) {
  const navigate = useNavigate();
  const { conversations } = useMessaging();
  
  // Calculate total unread count
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  const handleClick = () => {
    onClick?.();
    navigate('/messages');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "relative h-9 w-9 rounded-full",
        useLightTheme
          ? isDimmed 
            ? "text-slate-600 hover:text-slate-800 hover:bg-slate-50/30"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          : isDimmed 
            ? "hover:bg-[hsl(var(--clubhouse-hover-bg))]" 
            : "hover:bg-[hsl(var(--clubhouse-active-bg))]",
        className
      )}
      style={{ 
        color: useLightTheme 
          ? undefined 
          : isDimmed 
            ? 'hsl(var(--clubhouse-text-dimmed))' 
            : 'hsl(var(--clubhouse-text-muted))',
      }}
      aria-label={totalUnread > 0 ? `Messages (${totalUnread} unread)` : 'Messages'}
    >
      <MessageCircle className="h-5 w-5" />
      
      {/* Unread badge */}
      {totalUnread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
    </Button>
  );
}
