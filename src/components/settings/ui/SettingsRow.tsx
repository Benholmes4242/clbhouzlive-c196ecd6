import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconTheme, iconThemeStyles } from '../settingsTheme';

export type { IconTheme };
export { iconThemeStyles };

interface SettingsRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  showDivider?: boolean;
  isBeta?: boolean;
  isLocked?: boolean;
  iconTheme?: IconTheme;
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  rightContent,
  onClick,
  disabled = false,
  isFirst = false,
  isLast = false,
  showDivider = true,
  isBeta = false,
  isLocked = false,
  iconTheme = 'default',
}: SettingsRowProps) {
  const isClickable = !!onClick && !disabled && !isLocked;
  const theme = iconThemeStyles[iconTheme];

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'relative flex items-center w-full',
        'min-h-[60px] px-4 py-3',
        'transition-all duration-150',
        isClickable && 'cursor-pointer active:bg-muted active:scale-[0.98]',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-center flex-1 min-w-0 gap-3">
        {icon && (
          <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', theme.bg)}>
            <div className={cn('w-5 h-5', theme.text)}>{icon}</div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-foreground truncate">{title}</span>
            {isBeta && <SettingsBadge>Beta</SettingsBadge>}
            {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          </div>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 ml-3 flex items-center">
        {rightContent}
        {isClickable && !rightContent && (
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        )}
      </div>

      {showDivider && !isLast && (
        <div className="absolute bottom-0 left-16 right-0 h-px bg-border/40" />
      )}
    </div>
  );
}

export function SettingsBadge({ children, variant = 'default' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'destructive';
}) {
  return (
    <span
      className={cn(
        'text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
        variant === 'default' && 'bg-amber-500/15 text-amber-600',
        variant === 'destructive' && 'bg-destructive/15 text-destructive',
      )}
    >
      {children}
    </span>
  );
}
