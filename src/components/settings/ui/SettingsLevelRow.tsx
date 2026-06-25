import React from 'react';
import { cn } from '@/lib/utils';
import { IconTheme, iconThemeStyles } from '../settingsTheme';
import type { VisibilityLevel } from '@/hooks/usePrivacySettings';

interface SettingsLevelRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
  disabled?: boolean;
  isLast?: boolean;
  showDivider?: boolean;
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

export function SettingsLevelRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
  disabled = false,
  isLast = false,
  showDivider = true,
  iconTheme = 'privacy',
  publicLabel = 'Public',
  friendsLabel = 'Friends',
  privateLabel = 'Only me',
}: SettingsLevelRowProps) {
  const theme = iconThemeStyles[iconTheme];
  const labels: Record<VisibilityLevel, string> = {
    public: publicLabel,
    friends: friendsLabel,
    private: privateLabel,
  };

  return (
    <div className="w-full relative">
      <div className={cn('flex items-start w-full px-4 pt-3 pb-2.5 gap-3', disabled && 'opacity-60')}>
        {icon && (
          <div className={cn('flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center', theme.bg)}>
            <div className={cn('w-[18px] h-[18px]', theme.text)}>{icon}</div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-foreground">{title}</div>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 pl-[64px]">
        <div
          role="radiogroup"
          aria-label={title}
          className="flex w-full rounded-[10px] p-0.5"
          style={{ background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.08)' }}
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
                className={cn(
                  'flex-1 h-8 text-[13px] font-medium rounded-[8px] transition-colors',
                  selected
                    ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                {labels[opt.value]}
              </button>
            );
          })}
        </div>
      </div>

      {showDivider && !isLast && (
        <div style={{ position: 'absolute', bottom: 0, left: 64, right: 0, height: '0.5px', background: 'rgba(15,23,42,0.06)' }} />
      )}
    </div>
  );
}
