import React, { useMemo, useState, useRef, useCallback } from "react";
import { X, Trash2, Play, ListMusic, GripVertical, PlayCircle } from "lucide-react";
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
  onPlayNext: (videoId: string) => void;
  onRemove: (videoId: string) => void;
  onClear: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  nowPlayingId?: string | null;
  nowPlayingMeta?: QueueItemMeta | null;
  nextId?: string | null;
  nextMeta?: QueueItemMeta | null;
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
  onPlayNext,
  onRemove,
  onClear,
  onReorder,
  nowPlayingId,
  nowPlayingMeta,
  nextId,
  nextMeta,
}) => {
  const rows = useMemo(
    () => queue.map((id) => ({ id, meta: queueMeta[id] })),
    [queue, queueMeta]
  );

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    // Add a tiny delay to allow the drag image to be captured
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== dropIndex) {
      onReorder(dragIndex, dropIndex);
    }
    handleDragEnd();
  }, [dragIndex, onReorder, handleDragEnd]);

  const handleClearQueue = useCallback(() => {
    if (window.confirm('Clear entire queue?')) {
      onClear();
    }
  }, [onClear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110]">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
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
          "bg-zinc-900/95 backdrop-blur-xl border border-white/10",
          "rounded-t-2xl md:rounded-2xl",
          "max-h-[75vh] md:max-h-[65vh]",
          "overflow-hidden",
          "flex flex-col",
          "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
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
          
          {/* Now Playing / Next Up */}
          <div className="mt-2 space-y-1">
            {nowPlayingId && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-primary font-medium">Now playing:</span>
                <span className="text-white/70 truncate">
                  {nowPlayingMeta?.title || 'Loading...'}
                </span>
              </div>
            )}
            {nextId && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/50">Next up:</span>
                <span className="text-white/60 truncate">
                  {nextMeta?.title || queueMeta[nextId]?.title || 'Loading...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {rows.length === 0 ? (
            <div className="px-4 py-10 text-white/60 text-sm text-center flex flex-col items-center gap-3">
              <ListMusic className="h-8 w-8 text-white/20" />
              <p>Your queue is empty.</p>
              <p className="text-xs text-white/40">Add videos from the player</p>
            </div>
          ) : (
            rows.map(({ id, meta }, index) => (
              <div
                key={id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  "flex gap-2 px-3 py-2.5 transition-all cursor-grab active:cursor-grabbing",
                  index !== rows.length - 1 && "border-b border-white/5",
                  dragOverIndex === index && dragIndex !== index && "bg-primary/10 border-primary/30",
                  dragIndex === index && "opacity-50"
                )}
              >
                {/* Grip handle */}
                <div className="w-5 flex items-center justify-center text-white/30 shrink-0">
                  <GripVertical size={14} />
                </div>
                
                {/* Index */}
                <div className="w-5 flex items-center justify-center text-white/40 text-xs font-medium shrink-0">
                  {index + 1}
                </div>
                
                {/* Thumbnail */}
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 relative">
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
                    <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/70 text-white text-[9px] font-medium rounded">
                      {formatDuration(meta.durationSeconds)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {meta?.title || "Loading..."}
                  </div>
                  <div className="text-white/50 text-xs truncate">
                    {meta?.creatorName || ""}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayNow(id); }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/80 hover:bg-white/15 hover:text-white text-[10px] transition-colors"
                    >
                      <Play size={10} />
                      Play now
                    </button>
                    
                    {index > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPlayNext(id); }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/80 hover:bg-white/15 hover:text-white text-[10px] transition-colors"
                      >
                        <PlayCircle size={10} />
                        Play next
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(id); }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-400 text-[10px] transition-colors"
                    >
                      <Trash2 size={10} />
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
              onClick={handleClearQueue}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/70 text-sm transition-colors"
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
