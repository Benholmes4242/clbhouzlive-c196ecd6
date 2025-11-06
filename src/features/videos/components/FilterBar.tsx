/**
 * Horizontal filter bar for video categories
 */
const FILTERS = ["All","Trending","Pro Tips","Highlights","Funny","Instruction"];

export default function FilterBar({ active="All", onChange }:{
  active?: string; onChange?: (f:string)=>void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-2 no-scrollbar text-sm
                    text-gray-400 border-b border-gray-800/70">
      {FILTERS.map((f) => (
        <button key={f}
          onClick={() => onChange?.(f)}
          className={`rounded-full px-4 py-1 bg-gray-800/50 hover:bg-[#6e9277]/20 transition-colors ${f===active ? "text-white bg-[#6e9277]/20" : ""}`}>
          {f}
        </button>
      ))}
    </div>
  );
}
