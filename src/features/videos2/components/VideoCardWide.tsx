import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HLSVideo } from './HLSVideo';
import { EchoButton } from './EchoButton';
import { CourseTag } from './CourseTag';
import { VideoItem } from '../types';
import { Check } from 'lucide-react';

type VideoCardWideProps = {
  video: VideoItem;
  autoRegister?: (video: HTMLVideoElement | null) => void;
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

export function VideoCardWide({ video, autoRegister, onVideoClick, onEchoToggle }: VideoCardWideProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [echoActive, setEchoActive] = useState(false);
  const [echoCount, setEchoCount] = useState(video.echoes);

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

  return (
    <motion.div
      className="group cursor-pointer"
      onClick={() => onVideoClick(video.id)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Thumbnail/Video */}
      <div
        className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        onMouseEnter={() => setIsPreviewing(true)}
        onMouseLeave={() => setIsPreviewing(false)}
      >
        <HLSVideo
          hlsUrl={video.hlsUrl}
          src={video.src}
          poster={video.poster}
          className="w-full h-full object-cover"
          autoRegister={autoRegister}
        />

        {/* Duration pill */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-white text-xs font-medium">
          {formatDuration(video.durationSec)}
        </div>

        {/* Tag badge on preview */}
        <AnimatePresence>
          {isPreviewing && video.tag && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-white text-xs font-medium"
            >
              {tagIcons[video.tag]} {video.tag}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accent edge on hover */}
        {isPreviewing && (
          <div className="absolute inset-y-0 left-0 w-0.5 bg-[#6e9277]" />
        )}
      </div>

      {/* Metadata */}
      <div className="mt-3 flex gap-3">
        {/* Avatar */}
        <img
          src={video.user.avatar}
          alt={video.user.name}
          className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-800"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-white font-semibold text-base line-clamp-2 leading-snug mb-1">
            {video.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              {video.user.name}
              {video.user.verified && <Check size={14} className="text-[#6e9277]" />}
            </span>
            <span>•</span>
            <span>{formatViews(video.views)} golfers watched</span>
            <span>•</span>
            <span>{video.timeAgo}</span>
          </div>

          {/* Course + Echo */}
          <div className="flex items-center gap-3 mt-2">
            {video.course && <CourseTag course={video.course} size="sm" />}
            <EchoButton
              count={echoCount}
              active={echoActive}
              onToggle={handleEchoToggle}
              size="sm"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
