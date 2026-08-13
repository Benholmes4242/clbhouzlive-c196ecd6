/**
 * TrophyDetailSheet - Bottom sheet for trophy details
 */

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Trophy } from './types';
import { Trophy as TrophyIcon, Star, Target, Flag, Award, Medal, Crown, Zap, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMonthLongDayYear } from '@/i18n/format';

interface TrophyDetailSheetProps {
  trophy: Trophy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TROPHY_ICONS: Record<string, React.ElementType> = {
  trophy: TrophyIcon,
  star: Star,
  target: Target,
  flag: Flag,
  award: Award,
  medal: Medal,
  crown: Crown,
  zap: Zap,
};

export const TrophyDetailSheet: React.FC<TrophyDetailSheetProps> = ({
  trophy,
  open,
  onOpenChange,
}) => {
  if (!trophy) return null;

  const IconComponent = TROPHY_ICONS[trophy.iconKey] || TrophyIcon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-0 max-h-[85dvh]"
        style={{
          background: 'var(--dgp-bg-surface)',
          borderTop: '1px solid var(--dgp-glass-stroke)',
        }}
      >
        <SheetHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center',
                trophy.isRare && trophy.isUnlocked && 'animate-pulse'
              )}
              style={{
                background: trophy.isUnlocked
                  ? trophy.isRare
                    ? 'linear-gradient(135deg, var(--dgp-accent-gold), #A08B4A)'
                    : 'var(--dgp-accent-green)'
                  : 'var(--dgp-glass-surface)',
                boxShadow: trophy.isRare && trophy.isUnlocked
                  ? '0 0 40px rgba(200, 176, 106, 0.4)'
                  : undefined,
              }}
            >
              <IconComponent
                className="w-10 h-10"
                style={{
                  color: trophy.isUnlocked
                    ? 'var(--dgp-bg-primary)'
                    : 'var(--dgp-text-muted)',
                }}
              />
            </div>
          </div>

          <SheetTitle
            className="text-xl font-semibold"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            {trophy.name}
          </SheetTitle>

          {trophy.category && (
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--dgp-accent-green)' }}
            >
              {trophy.category}
            </span>
          )}
        </SheetHeader>

        <div className="space-y-6 px-2">
          <p
            className="text-center text-sm"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            {trophy.description}
          </p>

          {trophy.isUnlocked && trophy.earnedDate && (
            <div
              className="text-center py-3 rounded-xl"
              style={{ background: 'var(--dgp-glass-surface)' }}
            >
              <span
                className="text-xs"
                style={{ color: 'var(--dgp-text-muted)' }}
              >
                Earned on
              </span>
              <p
                className="text-sm font-medium mt-1"
                style={{ color: 'var(--dgp-text-primary)' }}
              >
                {formatMonthLongDayYear(trophy.earnedDate)}
              </p>
            </div>
          )}

          {!trophy.isUnlocked && (
            <div
              className="text-center py-3 rounded-xl"
              style={{ background: 'var(--dgp-glass-surface)' }}
            >
              <span
                className="text-sm"
                style={{ color: 'var(--dgp-text-muted)' }}
              >
                🔒 Keep playing to unlock this trophy
              </span>
            </div>
          )}

          {trophy.isUnlocked && (
            <Button
              variant="outline"
              className="w-full gap-2"
              style={{
                background: 'var(--dgp-glass-surface)',
                borderColor: 'var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-primary)',
              }}
            >
              <Share2 className="w-4 h-4" />
              Share Trophy
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default TrophyDetailSheet;
