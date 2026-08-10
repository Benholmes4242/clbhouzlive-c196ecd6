import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconTheme, iconThemeColor } from '../settingsTheme';
import {
  SETTINGS_ROW,
  SettingsGlyph,
  SettingsTitle,
  SettingsSubtitle,
  SettingsValue,
  SettingsFigure,
} from './rowParts';
import { BIZ_LABEL } from '@/features/courses/components/holes/analytical/tokens';

interface SettingsChevronRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  isExternal?: boolean;
  disabled?: boolean;
  isBeta?: boolean;
  value?: string;
  /** Render `value` as a tabular figure - it is a count, not a label. */
  valueIsFigure?: boolean;
  iconTheme?: IconTheme;
  isLocked?: boolean;
}

export function SettingsChevronRow({
  icon,
  title,
  subtitle,
  onClick,
  isExternal = false,
  disabled = false,
  isBeta = false,
  value,
  valueIsFigure = false,
  iconTheme = 'default',
  isLocked = false,
}: SettingsChevronRowProps) {
  const color = iconThemeColor[iconTheme];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-full flex items-start text-left transition-colors duration-150',
        'cursor-pointer active:opacity-70',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      style={SETTINGS_ROW}
    >
      <div className="flex items-start flex-1 min-w-0 gap-3">
        {icon && <SettingsGlyph color={color}>{icon}</SettingsGlyph>}
        <div className="flex-1 min-w-0">
          <SettingsTitle danger={iconTheme === 'danger'}>{title}</SettingsTitle>
          {subtitle && <SettingsSubtitle>{subtitle}</SettingsSubtitle>}
        </div>
      </div>

      <div className="flex-shrink-0 ml-3 flex items-center gap-2 self-center">
        {value && (valueIsFigure ? <SettingsFigure>{value}</SettingsFigure> : <SettingsValue>{value}</SettingsValue>)}
        {isLocked ? (
          <span style={BIZ_LABEL}>Locked</span>
        ) : isExternal ? (
          <ExternalLink className="w-[18px] h-[18px] text-muted-foreground/50" />
        ) : (
          <ChevronRight className="w-[18px] h-[18px] text-muted-foreground/50" />
        )}
      </div>
    </button>
  );
}
