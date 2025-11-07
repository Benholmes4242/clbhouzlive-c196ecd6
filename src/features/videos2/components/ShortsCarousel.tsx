import { useRef } from "react";
import { useAutoplayInRail } from "../hooks/useAutoplayInRail";
import type { VideoItem } from "../types";
export default function ShortsCarousel({ items }:{ items: VideoItem[] }){
  const railRef = useRef<HTMLDivElement>(null);
  const { register } = useAutoplayInRail<HTMLVideoElement>(railRef, 0.95);
  return (
    <div className="px-4 mt-6">
      <h2 className="text-sm text-gray-400 mb-2">🔥 Trending Shorts</h2>
      <div ref={railRef} className="flex gap-3 overflow-x-auto no-scrollbar">
        {items.map((s,i)=>(
          <div key={s.id} className="relative min-w-[180px] h-[320px] rounded-2xl overflow-hidden bg-gray-800">
            <video ref={el=>register(el,i)} src={s.src} poster={s.poster} muted loop playsInline preload="metadata" className="w-full h-full object-cover"/>
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-[2px] rounded-md">{Math.floor(s.durationSec/60)}:{String(s.durationSec%60).padStart(2,"0")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
