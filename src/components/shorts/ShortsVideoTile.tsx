import React from 'react';
import { useAutoplayInViewport } from '@/hooks/useAutoplayInViewport';
import { useRowAutoplay } from './RowAutoplayProvider';

type Props = {
  id: string;
  index: number;
  hlsUrl: string;
  posterUrl?: string;
  onClick?: () => void;
};

export default function ShortsVideoTile({
  id,
  index,
  hlsUrl,
  posterUrl,
  onClick
}: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [canPlay, setCanPlay] = React.useState(false);

  const { cols, getRow, canPlay: rowCanPlay, claim, release } = useRowAutoplay();
  const row = getRow(index);
  const col = index % cols;
  const leaderCol = row % 2 === 0 ? 0 : cols - 1;
  const isDesignatedLeader = col === leaderCol;

  // Start playback
  const start = React.useCallback(() => {
    const v = videoRef.current;
    if (!v || !isDesignatedLeader) return;

    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';

    const play = async () => {
      try {
        if (!canPlay) {
          await new Promise<void>((res) => {
            const on = () => { 
              setCanPlay(true); 
              v.removeEventListener('canplay', on); 
              res(); 
            };
            v.addEventListener('canplay', on, { once: true });
            v.load();
          });
        }
        if (rowCanPlay(row, id)) {
          await v.play();
        }
      } catch {
        // Ignore autoplay rejections
      }
    };

    play();
  }, [isDesignatedLeader, row, id, rowCanPlay, canPlay]);

  // Stop playback
  const stop = React.useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
  }, []);

  // Observe viewport per-card
  const { setNode } = useAutoplayInViewport(start, stop);

  // Register as row leader if designated
  React.useEffect(() => {
    if (isDesignatedLeader) claim(row, id);
    return () => { 
      if (isDesignatedLeader) release(row, id); 
    };
  }, [isDesignatedLeader, row, id, claim, release]);

  return (
    <div
      ref={setNode}
      className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-muted cursor-pointer"
      onClick={onClick}
    >
      <video
        ref={videoRef}
        poster={posterUrl}
        src={hlsUrl}
        playsInline
        muted
        loop
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        controls={false}
      />

      {/* Hover overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
    </div>
  );
}
