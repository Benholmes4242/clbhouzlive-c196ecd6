import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SettingsBadge } from './SettingsRow';
import { IconTheme, iconThemeStyles } from '../settingsTheme';

interface SettingsToggleRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  showDivider?: boolean;
  isBeta?: boolean;
  isIndented?: boolean;
  helperNote?: string;
  iconTheme?: IconTheme;
}

export function SettingsToggleRow({
  icon,
  title,
  subtitle,
  checked,
  onCheckedChange,
  disabled = false,
  isLoading = false,
  isFirst = false,
  isLast = false,
  showDivider = true,
  isBeta = false,
  isIndented = false,
  helperNote,
  iconTheme = 'default',
}: SettingsToggleRowProps) {
  const showHelper = helperNote && checked;
  const theme = iconThemeStyles[iconTheme];

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative flex items-center w-full',
          'min-h-[60px] py-3',
          isIndented ? 'pl-6 pr-4' : 'px-4',
          disabled && 'opacity-50',
          isLoading && 'opacity-75',
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
            </div>
            {subtitle && (
              <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 ml-3">
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled || isLoading}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
          />
        </div>

        {showDivider && !isLast && !showHelper && (
          <div className="absolute bottom-0 left-16 right-0 h-px bg-border/40" />
        )}
      </div>

      {showHelper && (
        <div className={cn('px-4 pb-3 -mt-1', isIndented && 'pl-6')}>
          <p className="text-[12px] text-muted-foreground ml-[52px]">{helperNote}</p>
          {showDivider && !isLast && (
            <div className="absolute bottom-0 left-16 right-0 h-px bg-border/40" />
          )}
        </div>
      )}
    </div>
  );
}
