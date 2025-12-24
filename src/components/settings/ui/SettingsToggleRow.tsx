import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SettingsBadge } from './SettingsRow';

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
}

/**
 * SettingsToggleRow - Row with toggle switch on the right (light theme)
 * Toggle uses slate/neutral colors (no orange)
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
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-between w-full max-w-full box-border',
        'min-h-[52px] md:min-h-[56px]',
        'px-[14px] py-[12px]',
        disabled && 'opacity-50',
        isFirst && 'rounded-t-[12px]',
        isLast && 'rounded-b-[12px]',
      )}
    >
      {/* Left content - min-width:0 prevents text from pushing layout wider */}
      <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
        {icon && (
          <div className="flex-shrink-0 w-[18px] h-[18px] text-[#5E666D]">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[15px] font-semibold text-[#1F2428] truncate overflow-hidden text-ellipsis">
              {title}
            </span>
            {isBeta && <SettingsBadge>Beta</SettingsBadge>}
          </div>
          {subtitle && (
            <p className="text-[13px] font-normal text-[#5E666D] truncate overflow-hidden text-ellipsis mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Toggle - slate/neutral colors */}
      <div className="flex-shrink-0 ml-3">
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled || isLoading}
          className="data-[state=checked]:bg-[#3A3F46] data-[state=unchecked]:bg-[#EDEFF2]"
        />
      </div>

      {/* Divider */}
      {showDivider && !isLast && (
        <div 
          className="absolute bottom-0 left-[14px] right-[14px] h-[1px]"
          style={{ background: 'rgba(31,36,40,0.06)' }}
        />
      )}
    </div>
  );
}
