import React from 'react';
import { MoreVertical, ListPlus, PlayCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { QueueItemMeta } from '@/hooks/useVideoQueue';

interface VideoQueueMenuProps {
  videoId: string;
  videoTitle: string;
  thumbnailUrl?: string;
  creatorName?: string;
  durationSeconds?: number;
  onPlayNext: (videoId: string, meta?: QueueItemMeta) => void;
  onEnqueue: (videoId: string, meta?: QueueItemMeta) => void;
  className?: string;
}

/**
 * VideoQueueMenu - Dropdown menu for video tile queue actions
 * - Play next: insert at front of queue
 * - Add to queue: append to end of queue
 */
export const VideoQueueMenu: React.FC<VideoQueueMenuProps> = ({
  videoId,
  videoTitle,
  thumbnailUrl,
  creatorName,
  durationSeconds,
  onPlayNext,
  onEnqueue,
  className,
}) => {
  const meta: QueueItemMeta | undefined = thumbnailUrl && creatorName ? {
    title: videoTitle,
    thumbnailUrl,
    creatorName,
    durationSeconds,
  } : undefined;

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayNext(videoId, meta);
  };

  const handleEnqueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEnqueue(videoId, meta);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 ${className}`}
          aria-label="Video options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-zinc-900 border-white/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          onClick={handlePlayNext}
          className="flex items-center gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <PlayCircle className="h-4 w-4" />
          <span>Play next</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleEnqueue}
          className="flex items-center gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <ListPlus className="h-4 w-4" />
          <span>Add to queue</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default VideoQueueMenu;
