import type { ChannelLite } from "../types";
export default function SuggestedChannels({ items }:{ items: ChannelLite[] }){
  return (
    <div className="px-4 mt-6">
      <h2 className="text-sm text-gray-400 mb-2">Suggested Channels</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {items.map(c => (
          <div key={c.id} className="min-w-[140px] bg-[#111] rounded-xl p-3 flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full border border-[#6e9277]/40"/>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{c.name}</p>
              <button className="mt-1 text-xs text-[#6e9277] bg-[#6e9277]/10 px-2 py-1 rounded-md">{c.subscribed?"Subscribed ✓":"Subscribe"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
