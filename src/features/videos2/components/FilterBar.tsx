export default function FilterBar({ active = "All", onChange }:{ active?: string; onChange?: (f:string)=>void; }){
  const filters = ["All","Pro Golf","Course Vlogs","Tips","Gear","Funny"]; 
  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3 no-scrollbar border-b border-gray-800/70">
      {filters.map(f => (
        <button key={f} onClick={()=>onChange?.(f)} className={`rounded-full px-4 py-1 text-sm whitespace-nowrap ${active===f?"bg-[#6e9277]/20 text-white":"bg-gray-800/60 text-gray-300 hover:bg-gray-700/60"}`}>{f}</button>
      ))}
    </div>
  );
}
