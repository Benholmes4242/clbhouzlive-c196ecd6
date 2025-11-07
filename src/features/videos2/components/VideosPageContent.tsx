import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAutoplay } from "../hooks/useAutoplay";
import FilterBar from "../components/FilterBar";
import VideoCardWide from "../components/VideoCardWide";
import VideoCardPair from "../components/VideoCardPair";
import SuggestedChannels from "../components/SuggestedChannels";
import ShortsCarousel from "../components/ShortsCarousel";
import type { VideoItem, ChannelLite } from "../types";

// TEMP MOCK DATA (replace with API wiring)
const mkUser = (i:number)=>({ id:`u${i}`, name:["Michael Campbell","Ethan Williams","Daniel Carlson"][i%3]||`User ${i}`, avatar:`https://i.pravatar.cc/100?img=${(i%70)+1}`});
const mkVid = (i:number): VideoItem => ({ id:`v${i}`, title:`Sample Video ${i}`, poster:`https://picsum.photos/seed/v${i}/1200/675`, durationSec: 60*((i%12)+3), views: 1000*i+214, timeAgo:`${(i%12)+1} days ago`, user: mkUser(i), echoes: (i%7)*13, tag: ["Tips","Course Vlog","Funny","Highlights"][i%4] as any, course: ["Royal Birkdale","Pebble Beach","Bearwood Lakes"][i%3], src: `https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`});
const VIDEOS: VideoItem[] = Array.from({length: 20}, (_,i)=>mkVid(i+1));
const SHORTS: VideoItem[] = Array.from({length: 6}, (_,i)=>mkVid(i+101));
const CHANNELS: ChannelLite[] = Array.from({length: 6}, (_,i)=>({ id:`c${i}`, name:`Channel ${i+1}`, avatar:`https://i.pravatar.cc/100?img=${(i%70)+1}`, verified: i%2===0 }));

export default function VideosPageContent(){
  const parentRef = useRef<HTMLDivElement>(null);
  const { register } = useAutoplay<HTMLVideoElement>(0.75);

  // Interleave: Wide → Pair → Wide → Pair … with rails
  type Row = { type: "wide"; a: VideoItem } | { type: "pair"; a: VideoItem; b?: VideoItem } | { type: "channels" } | { type: "shorts" };
  const rows: Row[] = [];
  for (let i=0;i<VIDEOS.length;i+=3){
    rows.push({ type:"wide", a: VIDEOS[i] });
    rows.push({ type:"pair", a: VIDEOS[i+1], b: VIDEOS[i+2] });
    if (i>0 && i%9===0) rows.push({ type:"channels" });
    if (i>0 && i%12===0) rows.push({ type:"shorts" });
  }

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => rows[i].type === "pair" ? 360 : rows[i].type === "wide" ? window.innerHeight*0.5+140 : 340,
    overscan: 6,
  });

  return (
    <div className="bg-[#0a0a0a] text-white">
      <FilterBar active="All"/>
      <div ref={parentRef} className="h-[calc(100vh-260px)] overflow-auto no-scrollbar relative">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((vi)=>{
            const row = rows[vi.index];
            const style: React.CSSProperties = { position:"absolute", top:0, left:0, right:0, transform:`translateY(${vi.start}px)` };
            if (row.type === "wide") return (
              <div key={vi.key} style={style}>
                <VideoCardWide item={row.a} register={(el)=>register(el, vi.index)}/>
              </div>
            );
            if (row.type === "pair") return (
              <div key={vi.key} style={style}>
                <VideoCardPair left={row.a} right={row.b} registerLeft={(el)=>register(el, vi.index)} registerRight={(el)=>register(el, vi.index+1)}/>
              </div>
            );
            if (row.type === "channels") return (
              <div key={vi.key} style={style}><SuggestedChannels items={CHANNELS}/></div>
            );
            return <div key={vi.key} style={style}><ShortsCarousel items={SHORTS}/></div>;
          })}
        </div>
      </div>
    </div>
  );
}
