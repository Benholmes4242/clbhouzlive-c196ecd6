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
  /** Indented sub-row styling (extra 14px left padding) */
  isIndented?: boolean;
  /** Helper note shown below the row when toggle is ON */
  helperNote?: string;
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
  isIndented = false,
  helperNote,
}: SettingsToggleRowProps) {
  const showHelper = helperNote && checked;

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative flex items-center justify-between w-full max-w-full box-border',
          'min-h-[52px] md:min-h-[56px]',
          'py-[12px]',
          isIndented ? 'pl-[28px] pr-[14px]' : 'px-[14px]',
          disabled && 'opacity-50',
        )}
      >
        {/* Left content - consistent icon rail: 32px fixed width */}
        <div className="flex items-center flex-1 min-w-0 overflow-hidden">
          {/* Icon rail - fixed 32px width for perfect alignment */}
          <div className="flex-shrink-0 w-[32px] h-[18px] flex items-center justify-center">
            {icon && (
              <div className="w-[18px] h-[18px] text-[#5E666D] flex items-center justify-center">
                {icon}
              </div>
            )}
          </div>
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
        {showDivider && !isLast && !showHelper && (
          <div 
            className="absolute bottom-0 left-[14px] right-[14px] h-[1px]"
            style={{ background: 'rgba(31,36,40,0.06)' }}
          />
        )}
      </div>

      {/* Helper note when toggle is ON */}
      {showHelper && (
        <div 
          className={cn(
            'px-[14px] pb-[12px] -mt-1',
            isIndented && 'pl-[28px]'
          )}
        >
          <p className="text-[12px] text-[#97A1AA]">{helperNote}</p>
          {/* Divider below helper */}
          {showDivider && !isLast && (
            <div 
              className="mt-3 h-[1px] -mx-[14px]"
              style={{ 
                background: 'rgba(31,36,40,0.06)',
                marginLeft: isIndented ? '-28px' : '-14px',
                marginRight: '-14px'
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
