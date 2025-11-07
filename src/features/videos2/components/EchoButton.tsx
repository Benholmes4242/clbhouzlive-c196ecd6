import { motion } from "framer-motion";
export default function EchoButton({ count, active, onToggle }:{ count: number; active?: boolean; onToggle?: ()=>void; }){
  return (
    <button aria-label="Echo" onClick={onToggle} className="flex items-center gap-1 text-sm text-gray-300">
      <motion.span animate={active ? { scale: [1,1.2,1] } : {}} className={`inline-block w-4 h-4 rounded-full ${active?"bg-[#6e9277]":"bg-gray-500"}`}/>
      <span className="text-gray-300">{count} Echoes</span>
    </button>
  );
}
