import React from 'react';
import { useRivals } from '@/hooks/useRivals';
import { cn } from '@/lib/utils';
import { Flame, Plus, Check } from 'lucide-react';

interface RivalryButtonProps {
  userId: string;
  targetUserId: string;
  className?: string;
}

export function RivalryButton({ userId, targetUserId, className }: RivalryButtonProps) {
  const { rivals, addRival, removeRival, isAddingRival, isRemovingRival } = useRivals(userId);

  // Don't show button for own profile
  if (userId === targetUserId) return null;

  const existingRival = rivals.find(r => r.rival_user_id === targetUserId);
  const isRival = !!existingRival;
  const isLoading = isAddingRival || isRemovingRival;
  const canAddMore = rivals.length < 2;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    if (isRival && existingRival) {
      removeRival(existingRival.id);
    } else if (canAddMore) {
      addRival(targetUserId);
    }
  };

  if (!isRival && !canAddMore) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all',
        isRival
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isRival ? (
        <>
          <Flame className="w-3 h-3" />
          <span>Rival</span>
        </>
      ) : (
        <>
          <Plus className="w-3 h-3" />
          <span>Add rival</span>
        </>
      )}
    </button>
  );
}
