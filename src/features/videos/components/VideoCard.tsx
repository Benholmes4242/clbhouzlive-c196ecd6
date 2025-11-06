import { motion } from "framer-motion";
import HLSVideo from "./HLSVideo";
import type { VideoItem } from "../types";

type Props = {
  item: VideoItem;
  register: (el: HTMLVideoElement | null) => void;
};

/**
 * Cinematic video card with overlay and engagement metrics
 * Used in the vertical feed
 */
export default function VideoCard({ item, register }: Props) {
  return (
    <div className="relative bg-[#111]">
      <HLSVideo
        hlsUrl={item.hlsUrl}
        src={item.src}
        poster={item.poster}
        autoRegister={register}
        className="w-full h-[62vh] md:h-[70vh] object-cover"
      />

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
      >
        <div className="flex justify-between items-end gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="w-8 h-8 rounded-full border border-white/30"
                loading="lazy"
              />
              <p className="text-white font-semibold text-[15px] truncate">{item.user.name}</p>
              {item.user.verified && <span className="text-xs text-[#6e9277]">✓</span>}
            </div>
            {item.caption && (
              <p className="text-gray-300 text-sm line-clamp-1">{item.caption}</p>
            )}
            {item.course && (
              <p className="text-xs text-[#6e9277] mt-1">{item.course}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[#6e9277] font-semibold text-sm">❤ {item.likes}</p>
            {typeof item.comments === "number" && (
              <p className="text-gray-300 text-xs">💬 {item.comments}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* HUD actions */}
      <button
        aria-label="More options"
        className="absolute top-3 right-3 rounded-full bg-black/50 backdrop-blur px-3 py-1 text-white"
      >
        ⋯
      </button>
    </div>
  );
}
