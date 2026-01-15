import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
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
  /** Icon color theme */
  iconTheme?: IconTheme;
}

/**
 * SettingsChevronRow - Navigational row with chevron or external link icon
 * Premium card-based styling with colored icon containers
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
        'min-h-[60px] px-4 py-3',
        'transition-colors duration-150',
        'cursor-pointer active:bg-gray-50',
        disabled && 'opacity-50 cursor-not-allowed',
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

      {/* Right content */}
      <div className="flex-shrink-0 ml-3 flex items-center gap-2">
        {value && (
          <span className="text-[13px] text-gray-400 max-w-[40%] truncate">{value}</span>
        )}
        {isExternal ? (
          <ExternalLink className="w-5 h-5 text-gray-300" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-300" />
        )}
      </div>

      {/* Divider - very subtle */}
      {showDivider && !isLast && (
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-50" />
      )}
    </button>
  );
}
