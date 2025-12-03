import React from 'react';
import { useRivals } from '@/hooks/useRivals';
import { cn } from '@/lib/utils';
import { Squircle } from '@/components/ui/squircle';
import { Flame, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RivalryCardProps {
  userId?: string;
  userTop100Count: number;
}

export function RivalryCard({ userId, userTop100Count }: RivalryCardProps) {
  const navigate = useNavigate();
  const { rivals, isLoading } = useRivals(userId);

  if (isLoading || rivals.length === 0) return null;

  // Find the closest rival (by top100 count difference)
  const closestRival = rivals[0]; // For now just show first rival

  if (!closestRival) return null;

  const rivalTop100 = closestRival.xp_data?.total_xp || 0; // Using XP as proxy for now
  const difference = Math.abs(userTop100Count - rivalTop100);
  const isAhead = userTop100Count > rivalTop100;

  return (
    <button
      type="button"
      onClick={() => navigate(`/profile/${closestRival.rival_user_id}?tab=top100`)}
      className={cn(
        'w-full rounded-2xl border px-3.5 py-2.5 flex items-center justify-between gap-3',
        'bg-rose-50/80 border-rose-200 hover:bg-rose-100/80 transition-colors',
        'animate-in fade-in duration-300'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Squircle width={40} height={40}>
            {closestRival.profile.profile_photo_url ? (
              <img
                src={closestRival.profile.profile_photo_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-rose-100 flex items-center justify-center text-rose-600 text-xs font-semibold">
                {closestRival.profile.display_name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '?'}
              </div>
            )}
          </Squircle>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
            <Flame className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide">
              Rival update
            </span>
          </div>
          <p className="text-sm font-medium text-rose-900">
            {isAhead
              ? `You're ${difference} courses ahead of ${closestRival.profile.display_name}`
              : `You're ${difference} courses behind ${closestRival.profile.display_name}`
            }
          </p>
        </div>
      </div>
      
      <ChevronRight className="w-4 h-4 text-rose-400 flex-shrink-0" />
    </button>
  );
}
