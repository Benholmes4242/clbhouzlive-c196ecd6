import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

type StoryRing = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  deltaIndex: number; // negative=improve
  lastUpdatedISO: string;
  hasUnseen: boolean;
};

/**
 * StoriesRow - Handicap performance stories
 * 
 * NOTE: Ring colors here are NOT achievement colors.
 * These are performance/status indicators (green=improved, red=declined, grey=neutral)
 * and intentionally remain separate from the Global Achievement & Milestone System.
 */
export default function StoriesRow({ items }: { items: StoryRing[] }) {
  return (
    <div className="px-3">
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 items-center">
        {items.map(s => {
          // Performance ring colors (not achievement colors)
          const ringColor =
            s.deltaIndex < 0 ? 'rgb(34, 197, 94)' :   // Green for improvement
            s.deltaIndex > 0 ? 'rgb(239, 68, 68)' :   // Red for decline
            'rgb(209, 213, 219)';                      // Grey for neutral
          
          return (
            <button
              key={s.userId}
              className="flex flex-col items-center shrink-0"
              onClick={() => console.log('open story viewer for', s.userId)}
              aria-label={`Open ${s.displayName}'s handicap story`}
            >
              <SquircleAvatar 
                size={64} 
                src={s.avatarUrl} 
                alt={s.displayName}
                ringColor={ringColor}
              />
              <span className="text-xs mt-1">
                {s.deltaIndex > 0 ? `+${s.deltaIndex.toFixed(1)}` : s.deltaIndex.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}