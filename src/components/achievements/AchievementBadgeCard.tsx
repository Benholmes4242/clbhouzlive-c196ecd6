import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type AchievementStatus = 'UNLOCKED' | 'LOCKED';
type AchievementType = 'MILESTONE' | 'LIST' | 'SKILL' | 'SEASONAL';

interface AchievementBadgeCardProps {
  title: string;
  subtitle: string;
  status: AchievementStatus;
  type: AchievementType;
  accentColor: string;
  icon?: React.ReactNode;
  unlockedAt?: string;
}

/**
 * AchievementBadgeCard - Reusable card for all achievement types
 * Used across Milestones, Lists, Skills, and Seasonal sections
 */
const AchievementBadgeCard: React.FC<AchievementBadgeCardProps> = ({
  title,
  subtitle,
  status,
  type,
  accentColor,
  icon,
  unlockedAt,
}) => {
  const isUnlocked = status === 'UNLOCKED';

  // Convert hex to rgba for subtle tint on unlocked cards
  const hexToRgba = (hex: string, alpha: number): string => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      className={cn(
        "rounded-sq-lg p-4 md:p-5 flex flex-col justify-between min-h-[120px] md:min-h-[140px] transition-all",
        isUnlocked
          ? "bg-white shadow-[0_18px_40px_rgba(15,118,110,0.12)] border border-emerald-50"
          : "bg-muted/60 border border-dashed border-muted-foreground/20 opacity-80"
      )}
    >
      {/* Top section: Icon + Title */}
      <div>
        <div className="mb-3">
          <div
            className={cn(
              "inline-flex items-center justify-center rounded-sq-md w-10 h-10 md:w-11 md:h-11",
              isUnlocked
                ? "bg-gradient-to-br from-white to-emerald-50"
                : "bg-muted"
            )}
            style={{
              boxShadow: isUnlocked ? `0 4px 12px ${hexToRgba(accentColor, 0.25)}` : undefined,
              border: isUnlocked ? `1.5px solid ${accentColor}` : '1px solid hsl(var(--border))',
            }}
          >
            {icon || (
              <Trophy 
                className={cn(
                  "h-5 w-5",
                  isUnlocked ? "" : "text-muted-foreground/50"
                )}
                style={{ color: isUnlocked ? accentColor : undefined }}
              />
            )}
          </div>
        </div>
        <p 
          className={cn(
            "text-sm md:text-base font-semibold leading-snug",
            isUnlocked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {title}
        </p>
        <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Bottom section: Status */}
      <p
        className={cn(
          "mt-3 text-[11px] md:text-xs font-medium",
          isUnlocked ? "text-emerald-600" : "text-muted-foreground"
        )}
      >
        {isUnlocked
          ? (unlockedAt ? `Unlocked · ${unlockedAt}` : "Unlocked")
          : "Locked"}
      </p>
    </div>
  );
};

export default AchievementBadgeCard;
