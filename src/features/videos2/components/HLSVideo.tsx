import Hls from "hls.js";
import { useEffect, useRef } from "react";
export default function HLSVideo({ hlsUrl, src, poster, className, autoRegister }:{ hlsUrl?: string; src?: string; poster?: string; className?: string; autoRegister?: (el: HTMLVideoElement | null)=>void; }){
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const video = ref.current; if (!video) return; let hls: Hls | null = null;
    if (hlsUrl && Hls.isSupported()) { hls = new Hls(); hls.loadSource(hlsUrl); hls.attachMedia(video); }
    else if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) { video.src = hlsUrl; }
    else if (src) { video.src = src; }
    return () => { if (hls) hls.destroy(); };
  }, [hlsUrl, src]);
  return <video ref={(el)=>{ref.current=el; autoRegister?.(el);}} poster={poster} muted loop playsInline preload="metadata" className={className}/>;
}
