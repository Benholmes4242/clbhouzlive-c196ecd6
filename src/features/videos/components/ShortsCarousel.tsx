import { useRef } from "react";
import { motion } from "framer-motion";
import { useAutoplayInRail } from "../hooks/useAutoplayInRail";
import type { VideoItem } from "../types";

/**
 * Horizontal scrolling carousel for Shorts videos
 * Videos autoplay when in view within the rail
 */
export default function ShortsCarousel({ items, title = "🔥 Trending Shorts" }:{
  items: VideoItem[]; title?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const { register } = useAutoplayInRail<HTMLVideoElement>(railRef, 0.95);

  return (
    <div className="px-4 mt-6">
      <h2 className="text-sm text-gray-400 mb-2">{title}</h2>
      <div ref={railRef} className="flex gap-3 overflow-x-auto no-scrollbar">
        {items.map((s, i) => (
          <motion.div
            key={s.id}
            whileHover={{ scale: 1.03 }}
            className="relative min-w-[180px] h-[320px] rounded-2xl overflow-hidden bg-gray-800"
          >
            <video
              ref={(el) => register(el, i)}
              src={s.src}
              poster={s.poster}
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
