import React, { useState, useRef, useEffect, useId, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { EchoButton } from './EchoButton';
import { CourseTag } from './CourseTag';
import { VideoItem } from '../types';
import { Check } from 'lucide-react';
import { preloadHlsManifest } from '@/utils/hlsPreload';

type VideoCardPairProps = {
  video: VideoItem;
  onVideoClick: (id: string) => void;
  onEchoToggle: (id: string) => void;
};

const tagIcons: Record<string, string> = {
  Tips: '🏌️',
  'Course Vlog': '📍',
  Funny: '🔥',
  Highlights: '🎯',
  Gear: '⚙️',
};

export function VideoCardPair({ video, onVideoClick, onEchoToggle }: VideoCardPairProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [echoActive, setEchoActive] = useState(false);
  const [echoCount, setEchoCount] = useState(video.echoes);
  const [shouldAttach, setShouldAttach] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HLSPlayerRef>(null);
  const mediaId = useId();

  const formatDuration = (sec: number): string => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  const formatViews = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const handleEchoToggle = () => {
    setEchoActive(!echoActive);
    setEchoCount(echoActive ? echoCount - 1 : echoCount + 1);
    onEchoToggle(video.id);
  };

  // Intersection observer for attach/autoplay
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShouldAttach(entry.isIntersecting);
        setAutoplay(entry.intersectionRatio >= 0.5);
      },
      { 
        root: null, 
        rootMargin: '300px 0px',
        threshold: [0, 0.5, 1.0] 
      }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Handle attach/detach
  useEffect(() => {
    if (shouldAttach) {
      playerRef.current?.attach();
    } else {
      playerRef.current?.detach();
    }
  }, [shouldAttach]);

  return (
    <motion.div
      ref={cardRef}
      className="group cursor-pointer"
      onClick={() => onVideoClick(video.id)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Thumbnail/Video */}
      <div
        className="relative aspect-[1.2/1] rounded-sq-md overflow-hidden bg-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        onMouseEnter={() => setIsPreviewing(true)}
        onMouseLeave={() => setIsPreviewing(false)}
      >
        <HLSPlayer
          ref={playerRef}
          src={video.hlsUrl || ''}
          mp4FallbackUrl={video.src}
          muted={true}
          autoplay={autoplay}
          loop={true}
          managedByMediaRuntime={false}
          externallyManaged={false}
          preload="auto"
          className="w-full h-full object-cover"
        />

        {/* Duration pill */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-xs font-medium z-10">
          {formatDuration(video.durationSec)}
        </div>

        {/* Tag badge on preview */}
        <AnimatePresence>
          {isPreviewing && video.tag && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-white text-xs font-medium z-10"
            >
              {tagIcons[video.tag]} {video.tag}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accent edge on hover */}
        {isPreviewing && (
          <div className="absolute inset-y-0 left-0 w-0.5 bg-[#6e9277] z-10" />
        )}
      </div>

      {/* Metadata */}
      <div className="mt-2">
        {/* Title */}
        <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
          {video.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            {video.user.name}
            {video.user.verified && <Check size={12} className="text-[#6e9277]" />}
          </span>
          <span>•</span>
          <span>{formatViews(video.views)}</span>
        </div>

        {/* Course + Echo */}
        <div className="flex items-center gap-2 mt-1.5">
          {video.course && <CourseTag course={video.course} size="sm" />}
          <EchoButton
            count={echoCount}
            active={echoActive}
            onToggle={handleEchoToggle}
            size="sm"
          />
        </div>
      </div>
    </motion.div>
  );
}