import React from "react";
import QueueDrawer from "./QueueDrawer";
import { useVideoPlaybackSafe } from "@/context/VideoPlaybackContext";
import { useVideoQueue } from "@/hooks/useVideoQueue";

/**
 * GlobalQueueDrawer - Queue drawer accessible from MiniPlayer
 * 
 * - Renders globally in App.tsx (no need for VideoPlayerModal to be mounted)
 * - Uses VideoPlaybackContext for open/close state
 * - Uses useVideoQueue for queue data and actions
 */
export const GlobalQueueDrawer: React.FC = () => {
  const playback = useVideoPlaybackSafe();
  const {
    queue,
    queueMeta,
    removeFromQueue,
    clearQueue,
  } = useVideoQueue();

  if (!playback) return null;

  return (
    <QueueDrawer
      isOpen={!!playback.isQueueOpen}
      onClose={playback.closeQueue}
      queue={queue}
      queueMeta={queueMeta}
      onPlayNow={(id) => {
        // Play immediately in the mini-player
        const meta = queueMeta[id];
        playback.openMini(id, meta ? {
          title: meta.title,
          creatorName: meta.creatorName,
          thumbnailUrl: meta.thumbnailUrl,
        } : undefined);

        // Remove from queue since it's now playing
        removeFromQueue(id);

        playback.closeQueue();
      }}
      onRemove={(id) => removeFromQueue(id)}
      onClear={() => clearQueue()}
    />
  );
};

export default GlobalQueueDrawer;
