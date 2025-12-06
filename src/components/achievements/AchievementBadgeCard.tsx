import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Top100TrophyIcon from '@/components/icons/Top100TrophyIcon';

export type AchievementStatus = 'UNLOCKED' | 'LOCKED';
export type AchievementType = 'MILESTONE' | 'LIST' | 'SKILL' | 'SEASONAL';

export interface AchievementBadgeCardProps {
  title: string;
  subtitle: string;
  status: AchievementStatus;
  type: AchievementType;
  accentColor: string;
  icon?: ReactNode;
  unlockedAt?: string;
}

/**
 * Shared achievement badge card for Milestones, Lists, Skills, Seasonal
 */
export const AchievementBadgeCard: React.FC<AchievementBadgeCardProps> = ({
  title,
  subtitle,
  status,
  type,
  accentColor,
  icon,
  unlockedAt,
}) => {
  const isUnlocked = status === 'UNLOCKED';

  return (
    <div
      className={cn(
        'rounded-sq-lg p-4 md:p-5 flex flex-col justify-between min-h-[120px] md:min-h-[140px] transition-all',
        isUnlocked
          ? 'bg-white shadow-[0_18px_40px_rgba(15,118,110,0.12)] border border-slate-100'
          : 'bg-slate-100/60 border border-dashed border-slate-300/40 opacity-75'
      )}
    >
      {/* Icon + Title */}
      <div>
        <div className="mb-3">
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-sq-md w-10 h-10 md:w-11 md:h-11',
              isUnlocked
                ? 'bg-gradient-to-br from-white to-slate-50'
                : 'bg-slate-200/60'
            )}
            style={isUnlocked ? { 
              background: `linear-gradient(135deg, rgba(255,255,255,0.95), color-mix(in srgb, ${accentColor} 12%, white))` 
            } : undefined}
          >
            {icon || (
              <Top100TrophyIcon
                className="h-5 w-5 md:h-6 md:w-6"
                style={{ color: isUnlocked ? accentColor : '#64748b' }}
              />
            )}
          </div>
        </div>
        <p className="text-sm md:text-base font-semibold leading-snug text-slate-900">
          {title}
        </p>
        <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Status text */}
      <p
        className={cn(
          'mt-3 text-[11px] md:text-xs font-medium',
          isUnlocked ? 'text-emerald-600' : 'text-slate-400'
        )}
      >
        {isUnlocked
          ? unlockedAt
            ? `Unlocked · ${unlockedAt}`
            : 'Unlocked'
          : 'Locked'}
      </p>
    </div>
  );
};

export default AchievementBadgeCard;
