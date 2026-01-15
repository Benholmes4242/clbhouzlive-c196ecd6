import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SettingsBadge, IconTheme } from './SettingsRow';

const iconThemeStyles: Record<IconTheme, { bg: string; text: string }> = {
  account: { bg: 'bg-blue-50', text: 'text-blue-500' },
  creator: { bg: 'bg-purple-50', text: 'text-purple-500' },
  privacy: { bg: 'bg-green-50', text: 'text-green-500' },
  notifications: { bg: 'bg-amber-50', text: 'text-amber-500' },
  security: { bg: 'bg-red-50', text: 'text-red-500' },
  support: { bg: 'bg-cyan-50', text: 'text-cyan-500' },
  legal: { bg: 'bg-gray-100', text: 'text-gray-500' },
  danger: { bg: 'bg-red-100', text: 'text-red-500' },
  default: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

interface SettingsToggleRowProps {
  /** Left icon (optional) */
  icon?: React.ReactNode;
  /** Row title */
  title: string;
  /** Short subtitle (one line max) */
  subtitle?: string;
  /** Toggle state */
  checked: boolean;
  /** Toggle change handler */
  onCheckedChange: (checked: boolean) => void;
  /** Whether toggle is disabled */
  disabled?: boolean;
  /** Whether row is loading */
  isLoading?: boolean;
  /** Whether row is first in section */
  isFirst?: boolean;
  /** Whether row is last in section */
  isLast?: boolean;
  /** Show divider below */
  showDivider?: boolean;
  /** Beta badge */
  isBeta?: boolean;
  /** Indented sub-row styling */
  isIndented?: boolean;
  /** Helper note shown below the row when toggle is ON */
  helperNote?: string;
  /** Icon color theme */
  iconTheme?: IconTheme;
}

/**
 * SettingsToggleRow - Row with toggle switch on the right
 * Premium card-based styling with colored icon containers
 */
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
        {/* Left content with icon container */}
        <div className="flex items-center flex-1 min-w-0 gap-3">
          {/* Icon container - 40x40, rounded-xl */}
          {icon && (
            <div 
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                theme.bg
              )}
            >
              <div className={cn('w-5 h-5', theme.text)}>
                {icon}
              </div>
            </div>
          )}
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium text-gray-900 truncate">
                {title}
              </span>
              {isBeta && <SettingsBadge>Beta</SettingsBadge>}
            </div>
            {subtitle && (
              <p className="text-[13px] text-gray-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Toggle - blue when active */}
        <div className="flex-shrink-0 ml-3">
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled || isLoading}
            className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-200"
          />
        </div>

        {/* Divider - very subtle */}
        {showDivider && !isLast && !showHelper && (
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-50" />
        )}
      </div>

      {/* Helper note when toggle is ON */}
      {showHelper && (
        <div className={cn('px-4 pb-3 -mt-1', isIndented && 'pl-6')}>
          <p className="text-[12px] text-gray-400 ml-[52px]">{helperNote}</p>
          {/* Divider below helper */}
          {showDivider && !isLast && (
            <div className="mt-3 h-px bg-gray-50 -mx-4" style={{ marginLeft: '-16px', marginRight: '-16px' }} />
          )}
        </div>
      )}
    </div>
  );
}
