import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AMBER, AMBER_TINT_10, INK_FAINT, INK_LIGHT, SURFACE } from './_shared/tokens';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  isOwn?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  duration: initialDuration,
  isOwn = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [waveformBars] = useState(() => 
    Array.from({ length: 35 }, () => Math.random() * 0.7 + 0.3)
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isDragging]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionFromEvent = (clientX: number): number => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, position));
  };

  const seekTo = (position: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = position * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    const position = getPositionFromEvent(e.clientX);
    seekTo(position);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = getPositionFromEvent(clientX);
    seekTo(position);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const position = getPositionFromEvent(clientX);
      seekTo(position);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeBarIndex = Math.floor((progress / 100) * waveformBars.length);

  return (
    <div className={cn(
      "flex items-center gap-3 min-w-[220px] max-w-[300px]",
    )}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause button — amber circle with glow */}
      <button
        onClick={togglePlayPause}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-[0.94]"
        style={{
          background: isOwn ? 'rgba(255,255,255,0.22)' : AMBER,
          color: isOwn ? SURFACE : SURFACE,
          boxShadow: isOwn ? 'none' : '0 4px 14px rgba(247,147,30,0.32)',
          border: 'none',
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="ml-0.5" fill="currentColor" />}
      </button>
      
      {/* Waveform with scrubber */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div 
          ref={progressRef}
          className="relative flex items-center gap-[2px] h-8 cursor-pointer group"
          onClick={handleProgressClick}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          {waveformBars.map((height, index) => (
            <div
              key={index}
              className={cn(
                "w-[2px] rounded-full transition-all duration-75",
                "group-hover:scale-y-110"
              )}
              style={{
                height: `${height * 100}%`,
                background: index < activeBarIndex
                  ? AMBER
                  : isOwn ? 'rgba(255,255,255,0.45)' : INK_LIGHT,
              }}
            />
          ))}
          
          {/* Scrubber handle */}
          <div 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-md transition-transform",
              isDragging ? "scale-125" : "scale-100 group-hover:scale-110"
            )}
            style={{ left: `calc(${progress}% - 5px)`, background: AMBER }}
          />
        </div>
        
        {/* Time display */}
        <div className="flex justify-between text-[10px]"
          style={{ color: isOwn ? 'rgba(247,147,30,0.70)' : INK_FAINT }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
