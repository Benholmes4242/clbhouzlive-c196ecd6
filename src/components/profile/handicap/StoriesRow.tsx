import React from 'react';

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
              <div className={`rounded-full p-[3px] ring-2 ring-offset-2 ring-offset-white ${ring}`}>
                <img src={s.avatarUrl} className="h-16 w-16 rounded-full object-cover" alt={s.displayName} />
              </div>
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