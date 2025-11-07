import HLSVideo from "./HLSVideo";
import EchoButton from "./EchoButton";
import CourseTag from "./CourseTag";
import type { VideoItem } from "../types";
export default function VideoCardPair({ left, right, registerLeft, registerRight }:{ left: VideoItem; right?: VideoItem; registerLeft: (el: HTMLVideoElement | null)=>void; registerRight: (el: HTMLVideoElement | null)=>void; }){
  const Cell = ({ v, reg }:{ v: VideoItem; reg: (el: HTMLVideoElement | null)=>void }) => (
    <div className="rounded-xl overflow-hidden bg-[#111] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div className="relative">
        <HLSVideo hlsUrl={v.hlsUrl} src={v.src} poster={v.poster} autoRegister={reg} className="w-full aspect-[4/3] object-cover"/>
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-[2px] rounded-md">{Math.floor(v.durationSec/60)}:{String(v.durationSec%60).padStart(2,"0")}</span>
      </div>
      <div className="p-3">
        <p className="text-white font-medium text-sm line-clamp-1">{v.title}</p>
        <p className="text-xs text-gray-400 mt-1">{v.user.name} • {Intl.NumberFormat().format(v.views)}</p>
        <div className="flex items-center justify-between mt-2">
          <CourseTag name={v.course}/>
          <EchoButton count={v.echoes}/>
        </div>
      </div>
    </div>
  );
  return (
    <div className="px-4 pb-4 grid grid-cols-2 gap-3">
      <Cell v={left} reg={registerLeft}/>
      {right ? <Cell v={right} reg={registerRight}/> : <div/>}
    </div>
  );
}
