import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsBadge } from './SettingsRow';

interface SettingsChevronRowProps {
  /** Left icon (optional) */
  icon?: React.ReactNode;
  /** Row title */
  title: string;
  /** Short subtitle (one line max) */
  subtitle?: string;
  /** Click handler */
  onClick: () => void;
  /** Whether it's an external link */
  isExternal?: boolean;
  /** Whether row is disabled */
  disabled?: boolean;
  /** Whether row is first in section */
  isFirst?: boolean;
  /** Whether row is last in section */
  isLast?: boolean;
  /** Show divider below */
  showDivider?: boolean;
  /** Beta badge */
  isBeta?: boolean;
  /** Right side value text */
  value?: string;
}

/**
 * SettingsChevronRow - Navigational row with chevron or external link icon (light theme)
 */
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
}: SettingsChevronRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-full max-w-full box-border flex items-center justify-between text-left',
        'min-h-[52px] md:min-h-[56px]',
        'px-[14px] py-[12px]',
        'transition-colors duration-[120ms]',
        'cursor-pointer hover:bg-[rgba(31,36,40,0.03)] active:bg-[rgba(31,36,40,0.05)]',
        disabled && 'opacity-50 cursor-not-allowed',
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

      {/* Right content */}
      <div className="flex-shrink-0 ml-3 flex items-center gap-2">
        {value && (
          <span className="text-[13px] text-[#97A1AA] max-w-[45%] truncate">{value}</span>
        )}
        {isExternal ? (
          <ExternalLink className="w-4 h-4 text-[#97A1AA]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#97A1AA]" />
        )}
      </div>

      {/* Divider */}
      {showDivider && !isLast && (
        <div 
          className="absolute bottom-0 left-[14px] right-[14px] h-[1px]"
          style={{ background: 'rgba(31,36,40,0.06)' }}
        />
      )}
    </button>
  );
}
