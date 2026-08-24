import React from 'react';
import { cn } from '@/lib/utils';
import { IconTheme, iconThemeColor } from '../settingsTheme';
import { SETTINGS_ROW, SettingsGlyph, SettingsTitle, SettingsSubtitle } from './rowParts';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { VisibilityLevel } from '@/hooks/usePrivacySettings';

interface SettingsLevelRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
  disabled?: boolean;
  iconTheme?: IconTheme;
  publicLabel?: string;
  friendsLabel?: string;
  privateLabel?: string;
}

const OPTIONS: { value: VisibilityLevel; key: 'pub' | 'fr' | 'pri' }[] = [
  { value: 'public', key: 'pub' },
  { value: 'friends', key: 'fr' },
  { value: 'private', key: 'pri' },
];

const SEG_LABEL: React.CSSProperties = {
  fontSize: 7.5,
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
};

export function SettingsLevelRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
  disabled = false,
  iconTheme = 'default',
  publicLabel = 'Public',
  friendsLabel = 'Friends',
  privateLabel = 'Only me',
}: SettingsLevelRowProps) {
  const color = iconThemeColor[iconTheme];
  const labels: Record<VisibilityLevel, string> = {
    public: publicLabel,
    friends: friendsLabel,
    private: privateLabel,
  };

  return (
    <div className="w-full" style={{ padding: '13px 0' }}>
      <div className={cn('flex items-start w-full gap-3', disabled && 'opacity-60')}>
        {icon && <SettingsGlyph color={color}>{icon}</SettingsGlyph>}
        <div className="flex-1 min-w-0">
          <SettingsTitle>{title}</SettingsTitle>
          {subtitle && <SettingsSubtitle>{subtitle}</SettingsSubtitle>}
        </div>
      </div>

      {/* The segmented control: an INK-filled selected segment, no white pill,
          no shadow. The iOS convention is not this treatment. */}
      <div
        role="radiogroup"
        aria-label={title}
        className="flex w-full mt-2.5"
        style={{ background: A.TRACK, borderRadius: 999, padding: 3 }}
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => !selected && onChange(opt.value)}
              className="flex-1 transition-colors"
              style={{
                ...SEG_LABEL,
                minHeight: 38,
                borderRadius: 999,
                background: selected ? A.INK : 'transparent',
                color: selected ? A.CANVAS : A.MUTE,
              }}
            >
              {labels[opt.value]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
