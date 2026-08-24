import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { IconTheme, iconThemeColor } from '../settingsTheme';
import { SETTINGS_ROW, SettingsGlyph, SettingsTitle, SettingsSubtitle } from './rowParts';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface SettingsToggleRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
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
  isBeta = false,
  isIndented = false,
  helperNote,
  iconTheme = 'default',
}: SettingsToggleRowProps) {
  const showHelper = helperNote && checked;
  const color = iconThemeColor[iconTheme];

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative flex items-start w-full',
          isIndented && 'pl-3',
          disabled && 'opacity-50',
          isLoading && 'opacity-75',
        )}
        style={SETTINGS_ROW}
      >
        <div className="flex items-start flex-1 min-w-0 gap-3">
          {icon && <SettingsGlyph color={color}>{icon}</SettingsGlyph>}
          <div className="flex-1 min-w-0">
            <SettingsTitle>{title}</SettingsTitle>
            {subtitle && <SettingsSubtitle>{subtitle}</SettingsSubtitle>}
          </div>
        </div>

        <div className="flex-shrink-0 ml-3 self-center">
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled || isLoading}
            className={cn(
              'relative before:absolute before:content-[""] before:-inset-y-2.5 before:-inset-x-1',
              // ON is the near-white ink fill, OFF is a raised track with a hairline:
              // unmistakable at a glance on the dark canvas.
              'data-[state=checked]:bg-[#F8FAFC] data-[state=unchecked]:bg-[rgba(255,255,255,0.14)]',
              'data-[state=unchecked]:border data-[state=unchecked]:border-[rgba(255,255,255,0.18)]',
            )}
          />
        </div>
      </div>

      {showHelper && (
        <p style={{ fontSize: 12, color: A.MUTE, paddingBottom: 11, marginTop: -6, lineHeight: 1.45 }}>
          {helperNote}
        </p>
      )}
    </div>
  );
}
