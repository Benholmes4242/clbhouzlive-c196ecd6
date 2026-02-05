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
 * 
 * Light UI styling with consistent vertical rhythm
 */

interface NotificationCardProps {
  /** Avatar/icon element */
  avatar: React.ReactNode;
  /** Main title/headline */
  title: React.ReactNode;
  /** Optional subtext/body content */
  subtext?: React.ReactNode;
  /** Action buttons (0-3) */
  actions?: React.ReactNode;
  /** Timestamp text */
  timestamp: string;
  /** Whether this notification is unread/new */
  isNew?: boolean;
  /** Click handler for the main content area */
  onClick?: () => void;
  /** Handler for opening the actions menu */
  onMenuClick?: () => void;
  /** Additional className for the container */
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
        // Light UI: consistent page background with orange tint when new
        isNew 
          ? "bg-primary/[0.04]" 
          : "bg-background hover:bg-muted/40",
        className
      )}
    >
      {/* Unread dot indicator */}
      <div className="w-2 shrink-0 flex items-start justify-center pt-5">
        {isNew && (
          <span className="w-2 h-2 rounded-full bg-primary" />
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
        className="flex-1 flex items-start gap-3 text-left min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
      >
        {/* Avatar - decorative */}
        <div className="shrink-0" aria-hidden="true">{avatar}</div>
        
        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header row: Title */}
          <p className={cn(
            "text-[0.875rem] leading-snug",
            isNew ? "text-foreground" : "text-foreground/90"
          )}>
            {title}
          </p>
          
          {/* Body row: Subtext (optional) */}
          {subtext && (
            <div className="text-[0.75rem] text-muted-foreground">
              {subtext}
            </div>
          )}
          
          {/* Actions row: Buttons (optional) */}
          {actions && (
            <div 
              className="mt-2 flex items-center flex-wrap gap-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
          
          {/* Meta row: Timestamp */}
          <p className="text-[0.75rem] text-muted-foreground/70 mt-1">{timestamp}</p>
        </div>
      </div>

      {/* Kebab menu */}
      {onMenuClick && (
        <button
          type="button"
          className="shrink-0 p-2 -mr-2 rounded-full hover:bg-muted/50 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
 * Shared button styles for notification actions
 * Use these classes to ensure consistent button styling across all notifications
 */
export const notificationButtonStyles = {
  // Base pill style
  base: "inline-flex items-center justify-center rounded-sq-xs border px-3 h-7 text-xs font-medium transition-colors gap-1.5",
  
  // Primary action (e.g., Accept)
  primary: "border-emerald-500 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15",
  
  // Secondary/Ghost action (e.g., Decline)
  secondary: "border-border bg-background text-foreground/80 hover:bg-muted/50",
  
  // Destructive action
  destructive: "border-red-400 bg-red-500/5 text-red-500 hover:bg-red-500/10",
  
  // Support/Orange accent
  support: "border-primary bg-primary/10 text-primary hover:bg-primary/20",
  
  // Status pills (non-interactive)
  statusSuccess: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
  statusError: "border-red-400 bg-red-500/5 text-red-500",
  statusMuted: "border-border bg-muted text-muted-foreground",
  statusPending: "border-amber-500 bg-amber-500/10 text-amber-600",
};

/**
 * Helper to combine base + variant styles
 */
export const getNotificationButtonClass = (variant: keyof typeof notificationButtonStyles) => {
  if (variant === 'base') return notificationButtonStyles.base;
  return cn(notificationButtonStyles.base, notificationButtonStyles[variant]);
};
