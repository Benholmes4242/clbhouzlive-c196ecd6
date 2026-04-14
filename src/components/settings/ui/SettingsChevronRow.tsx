import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsBadge } from './SettingsRow';
import { IconTheme, iconThemeStyles } from '../settingsTheme';

interface SettingsChevronRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  isExternal?: boolean;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  showDivider?: boolean;
  isBeta?: boolean;
  value?: string;
  iconTheme?: IconTheme;
}

export function SettingsChevronRow({
  icon,
  title,
  subtitle,
  onClick,
  isExternal = false,
  disabled = false,
  isFirst = false,
  isLast = false,
  showDivider = true,
  isBeta = false,
  value,
  iconTheme = 'default',
}: SettingsChevronRowProps) {
  const theme = iconThemeStyles[iconTheme];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-full flex items-center text-left',
        'min-h-[52px] px-4 py-2.5',
        'transition-all duration-150',
        'cursor-pointer active:bg-muted active:scale-[0.98]',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-center flex-1 min-w-0 gap-3">
        {icon && (
          <div className={cn('flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center', theme.bg)}>
            <div className={cn('w-[18px] h-[18px]', theme.text)}>{icon}</div>
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

      <div className="flex-shrink-0 ml-3 flex items-center gap-2">
        {value && (
          <span className="text-[13px] text-muted-foreground max-w-[40%] truncate">{value}</span>
        )}
        {isExternal ? (
          <ExternalLink className="w-5 h-5 text-muted-foreground/50" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        )}
      </div>

      {showDivider && !isLast && (
        <div style={{ position: 'absolute', bottom: 0, left: 64, right: 0, height: '0.5px', background: 'rgba(15,23,42,0.06)' }} />
      )}
    </button>
  );
}
