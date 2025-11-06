import type { VideoItem } from "../types";

/**
 * Bottom bar showing "Up next" video preview
 * Helps users know what's coming next in the feed
 */
export default function SmartPlaylistBar({ next }:{ next?: VideoItem }) {
  if (!next) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur-xl
                    border-t border-gray-800 flex justify-between items-center px-5 py-3 z-40">
      <div>
        <p className="text-xs text-gray-400">Up next</p>
        <p className="text-sm text-white font-semibold">
          {next.user.name}{next.course ? ` – ${next.course}` : ""}
        </p>
      </div>
      <button className="bg-[#6e9277]/20 text-[#6e9277] px-4 py-1 rounded-full hover:bg-[#6e9277]/30">
        Play ▶
      </button>
    </div>
  );
}
