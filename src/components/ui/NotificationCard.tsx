import React from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * NotificationCard - Standardised notification layout component
 * 
 * Structure:
 * 1. Header row: avatar + title + kebab menu
 * 2. Body row: subtext/reason (optional)
 * 3. Actions row: buttons (0–3)
 * 4. Meta row: timestamp
 */

interface NotificationCardProps {
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtext?: React.ReactNode;
  actions?: React.ReactNode;
  timestamp: string;
  isNew?: boolean;
  onClick?: () => void;
  onMenuClick?: () => void;
  className?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  avatar,
  title,
  subtext,
  actions,
  timestamp,
  isNew = false,
  onClick,
  onMenuClick,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        isNew 
          ? "bg-[#F7931E]/[0.04]" 
          : "bg-background hover:bg-muted/40",
        className
      )}
    >
      {/* Unread dot indicator - brand orange */}
      <div className="w-2 shrink-0 flex items-start justify-center pt-5">
        {isNew && (
          <span className="w-2 h-2 rounded-full bg-[#F7931E]" />
        )}
      </div>

      {/* Main clickable area */}
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (!onClick) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className="flex-1 flex items-start gap-3 text-left min-w-0 min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,50%)]/40 focus-visible:ring-offset-2 rounded-sm"
      >
        {/* Avatar */}
        <div className="shrink-0" aria-hidden="true">{avatar}</div>
        
        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className={cn(
            "text-[0.875rem] leading-snug",
            isNew ? "text-foreground" : "text-foreground/90"
          )}>
            {title}
          </p>
          
          {subtext && (
            <div className="text-[0.75rem] text-muted-foreground">
              {subtext}
            </div>
          )}
          
          {actions && (
            <div 
              className="mt-2 flex items-center flex-wrap gap-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
        </div>
      </div>

      {/* Kebab menu - 44pt tap target */}
      {onMenuClick && (
        <button
          type="button"
          className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-full hover:bg-muted/50 active:opacity-60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38,92%,50%)]/40 focus-visible:ring-offset-2"
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick();
          }}
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

/**
 * Shared button styles for notification actions — semantic tokens
 */
export const notificationButtonStyles = {
  base: "inline-flex items-center justify-center rounded-sq-xs border px-3 h-9 text-xs font-medium transition-colors gap-1.5 active:scale-[0.93]",
  
  // Primary — brand primary
  primary: "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)] hover:bg-[hsl(38,92%,50%)]/20",
  
  // Secondary
  secondary: "border-border bg-background text-foreground/80 hover:bg-muted/50",
  
  // Destructive — semantic destructive token
  destructive: "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
  
  // Support — brand accent
  support: "border-[hsl(38,92%,50%)] bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)] hover:bg-[hsl(38,92%,50%)]/20",
  
  // Status pills (non-interactive)
  statusSuccess: "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)]",
  statusError: "border-destructive/30 bg-destructive/10 text-destructive",
  statusMuted: "border-border bg-muted text-muted-foreground",
  statusPending: "border-amber-500/30 bg-amber-500/10 text-amber-600",
};

/**
 * Helper to combine base + variant styles
 */
export const getNotificationButtonClass = (variant: keyof typeof notificationButtonStyles) => {
  if (variant === 'base') return notificationButtonStyles.base;
  return cn(notificationButtonStyles.base, notificationButtonStyles[variant]);
};
