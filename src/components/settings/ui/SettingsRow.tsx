import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconTheme, iconThemeColor } from '../settingsTheme';
import { SETTINGS_ROW, SettingsGlyph, SettingsTitle, SettingsSubtitle } from './rowParts';

export type { IconTheme };

interface SettingsRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
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
  isBeta = false,
  isLocked = false,
  iconTheme = 'default',
}: SettingsRowProps) {
  const isClickable = !!onClick && !disabled && !isLocked;
  const color = iconThemeColor[iconTheme];

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'relative flex items-start w-full transition-colors duration-150',
        isClickable && 'cursor-pointer active:opacity-70',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      style={SETTINGS_ROW}
    >
      <div className="flex items-start flex-1 min-w-0 gap-3">
        {icon && <SettingsGlyph color={color}>{icon}</SettingsGlyph>}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <SettingsTitle danger={iconTheme === 'danger'}>{title}</SettingsTitle>
            {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />}
          </div>
          {subtitle && <SettingsSubtitle>{subtitle}</SettingsSubtitle>}
        </div>
      </div>

      <div className="flex-shrink-0 ml-3 flex items-center self-center">
        {rightContent}
        {isClickable && !rightContent && (
          <ChevronRight className="w-[18px] h-[18px] text-muted-foreground/50" />
        )}
      </div>
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
        'text-[11px] font-semibold uppercase tracking-[0.10em] px-2 py-0.5 rounded-full',
        variant === 'default' && 'bg-amber-500/15 text-amber-600',
        variant === 'destructive' && 'bg-destructive/15 text-destructive',
      )}
    >
      {children}
    </span>
  );
}
