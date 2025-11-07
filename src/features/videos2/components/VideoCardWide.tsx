import HLSVideo from "./HLSVideo";
import EchoButton from "./EchoButton";
import CourseTag from "./CourseTag";
import type { VideoItem } from "../types";
export default function VideoCardWide({ item, register }:{ item: VideoItem; register: (el: HTMLVideoElement | null)=>void; }){
  const mins = Math.floor(item.durationSec/60).toString();
  const secs = String(item.durationSec%60).padStart(2,"0");
  return (
    <div className="px-4 py-5">
      <div className="relative rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
        <HLSVideo hlsUrl={item.hlsUrl} src={item.src} poster={item.poster} autoRegister={register} className="w-full aspect-video object-cover"/>
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-[2px] rounded-md">{mins}:{secs}</span>
      </div>
      <div className="flex gap-3 mt-3">
        <img src={item.user.avatar} alt={item.user.name} className="w-10 h-10 rounded-full border border-gray-700"/>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white leading-snug line-clamp-2">{item.title}</p>
          <p className="text-sm text-gray-400 mt-1">
            {item.user.name} {item.user.verified && "✓"} • {Intl.NumberFormat().format(item.views)} golfers watched • {item.timeAgo}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <CourseTag name={item.course}/>
            <EchoButton count={item.echoes}/>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white text-xl" aria-label="More">⋮</button>
      </div>
    </div>
  );
}
