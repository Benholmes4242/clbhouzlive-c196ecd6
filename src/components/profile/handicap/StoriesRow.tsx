import React from 'react';
import AvatarSquircle from '@/components/ui/AvatarSquircle';

type StoryRing = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  deltaIndex: number; // negative=improve
  lastUpdatedISO: string;
  hasUnseen: boolean;
};

export default function StoriesRow({ items }: { items: StoryRing[] }) {
  return (
    <div className="px-3">
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 items-center">
        {items.map(s => {
          const ring =
            s.deltaIndex < 0 ? 'ring-green-500' :
            s.deltaIndex > 0 ? 'ring-red-500' : 'ring-gray-300';
          return (
            <button
              key={s.userId}
              className="flex flex-col items-center shrink-0"
              onClick={() => console.log('open story viewer for', s.userId)}
              aria-label={`Open ${s.displayName}'s handicap story`}
            >
              <AvatarSquircle 
                size={56} 
                src={s.avatarUrl}
                alt={s.displayName}
                ringColor={
                  s.deltaIndex < 0 ? 'rgb(34, 197, 94)' :
                  s.deltaIndex > 0 ? 'rgb(239, 68, 68)' : 'rgb(209, 213, 219)'
                }
                ringWidth={2}
                className="ring-2 ring-offset-2 ring-offset-white"
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