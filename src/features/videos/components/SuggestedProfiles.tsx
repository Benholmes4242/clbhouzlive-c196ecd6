import type { ProfileItem } from "../types";

/**
 * Horizontal scrolling carousel for suggested user profiles
 */
export default function SuggestedProfiles({ items }:{ items: ProfileItem[] }) {
  return (
    <div className="px-4 mt-8">
      <h2 className="text-sm text-gray-400 mb-2">👋 Who to follow</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {items.map((p) => (
          <div key={p.id} className="flex flex-col items-center text-center min-w-[90px]">
            <img src={p.avatar} alt={p.name}
                 className="w-14 h-14 rounded-full mb-2 border border-[#6e9277]/40"
                 loading="lazy" />
            <p className="text-xs font-semibold text-white truncate w-[80px]">{p.name}</p>
            {p.club && <p className="text-[10px] text-gray-400 truncate w-[80px]">{p.club}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
