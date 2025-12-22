/**
 * ShortsVideoTile - Grid tile for shorts
 * 
 * Uses MediaRuntime for playback control.
 * No direct play/pause calls.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MediaRuntime } from '@/media/runtime';
import { useMediaAutoplay } from '@/media/useMediaAutoplay';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';

type Props = {
  id: string;
  hlsUrl: string;
  posterUrl?: string;
  sortIndex: number;
  onClick?: () => void;
};

export default function ShortsVideoTile({
  id,
  hlsUrl,
  posterUrl,
  sortIndex,
  onClick
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HLSPlayerRef>(null);
  const { registerMedia, playingIds } = useMediaAutoplay({ surface: 'grid' });
  const isPlaying = playingIds.has(id);

  // Register with MediaRuntime via useMediaAutoplay
  useEffect(() => {
    const video = playerRef.current?.getElement();
    if (!video) return;

    registerMedia({
      id,
      element: video,
      isCandidate: true,
      sortIndex,
      observeTarget: containerRef.current,
    });

    return () => {
      registerMedia({ id, element: null });
    };
  }, [id, sortIndex, registerMedia]);

  return (
    <div
      ref={containerRef}
      className="group relative aspect-[9/16] overflow-hidden rounded bg-muted cursor-pointer"
      onClick={onClick}
    >
      <HLSPlayer
        ref={playerRef}
        src={hlsUrl}
        poster={posterUrl}
        autoplay={isPlaying}
        muted
        loop
        showMuteButton={false}
        showPlayButton={false}
        objectFit="cover"
        className="absolute inset-0 h-full w-full"
      />

      {/* Hover overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
    </div>
  );
}
