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
    playNext,
    removeFromQueue,
    clearQueue,
    moveQueueItem,
    peekNext,
    getMeta,
  } = useVideoQueue();

  if (!playback) return null;

  const nextId = peekNext();
  const nextMeta = nextId ? getMeta(nextId) : null;

  return (
    <QueueDrawer
      isOpen={!!playback.isQueueOpen}
      onClose={playback.closeQueue}
      queue={queue}
      queueMeta={queueMeta}
      nowPlayingId={playback.activeVideoId}
      nowPlayingMeta={playback.miniMeta ? {
        title: playback.miniMeta.title,
        thumbnailUrl: playback.miniMeta.thumbnailUrl,
        creatorName: playback.miniMeta.creatorName,
      } : null}
      nextId={nextId}
      nextMeta={nextMeta}
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
      onPlayNext={(id) => {
        const meta = queueMeta[id];
        playNext(id, meta);
      }}
      onRemove={(id) => removeFromQueue(id)}
      onClear={() => clearQueue()}
      onReorder={moveQueueItem}
    />
  );
};

export default GlobalQueueDrawer;
