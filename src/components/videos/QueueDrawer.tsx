import React, { useMemo } from "react";
import { X, Trash2, Play, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QueueItemMeta {
  title: string;
  thumbnailUrl: string;
  creatorName: string;
  durationSeconds?: number;
}

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: string[];
  queueMeta: Record<string, QueueItemMeta | undefined>;
  onPlayNow: (videoId: string) => void;
  onRemove: (videoId: string) => void;
  onClear: () => void;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  queueMeta,
  onPlayNow,
  onRemove,
  onClear,
}) => {
  const rows = useMemo(
    () => queue.map((id) => ({ id, meta: queueMeta[id] })),
    [queue, queueMeta]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110]">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close queue"
      />

      {/* Sheet / Panel */}
      <div
        className={cn(
          "absolute",
          // Mobile: bottom sheet
          "left-0 right-0 bottom-0",
          // Desktop: right-side floating panel
          "md:left-auto md:right-4 md:bottom-4 md:w-[420px] md:rounded-2xl",
          "bg-black/90 backdrop-blur-xl border border-white/10",
          "rounded-t-2xl md:rounded-2xl",
          "max-h-[70vh] md:max-h-[60vh]",
          "overflow-hidden",
          "flex flex-col",
          "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ListMusic className="h-4 w-4 text-white/60" />
            Queue{" "}
            <span className="text-white/50 font-normal">({queue.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {rows.length === 0 ? (
            <div className="px-4 py-10 text-white/60 text-sm text-center">
              Your queue is empty.
            </div>
          ) : (
            rows.map(({ id, meta }, index) => (
              <div
                key={id}
                className={cn(
                  "flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors",
                  index !== rows.length - 1 && "border-b border-white/5"
                )}
              >
                {/* Index */}
                <div className="w-6 flex items-center justify-center text-white/40 text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                
                {/* Thumbnail */}
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 relative">
                  {meta?.thumbnailUrl ? (
                    <img
                      src={meta.thumbnailUrl}
                      alt={meta.title || "Video thumbnail"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-4 w-4 text-white/30" />
                    </div>
                  )}
                  {meta?.durationSeconds && (
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-[10px] font-medium rounded">
                      {formatDuration(meta.durationSeconds)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {meta?.title || "Loading..."}
                  </div>
                  <div className="text-white/60 text-xs truncate mt-0.5">
                    {meta?.creatorName || ""}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onPlayNow(id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/15 hover:text-white text-xs transition-colors"
                    >
                      <Play size={12} />
                      Play now
                    </button>

                    <button
                      onClick={() => onRemove(id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/15 hover:text-white text-xs transition-colors"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {queue.length > 0 && (
          <div className="px-4 py-3 border-t border-white/10 shrink-0">
            <button
              onClick={onClear}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/85 hover:text-white text-sm transition-colors"
            >
              Clear queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueDrawer;
