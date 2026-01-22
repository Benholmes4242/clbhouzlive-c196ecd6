import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [waveformBars] = useState(() => 
    Array.from({ length: 25 }, () => Math.random() * 0.7 + 0.3)
  );
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
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
  }, []);

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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeBarIndex = Math.floor((progress / 100) * waveformBars.length);

  return (
    <div className="flex items-center gap-3 min-w-[180px] max-w-[240px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause button */}
      <button
        onClick={togglePlayPause}
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors",
          isOwn 
            ? "bg-white/20 hover:bg-white/30 text-[#F7931E]" 
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>
      
      {/* Waveform visualization */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-[2px] h-5">
          {waveformBars.map((height, index) => (
            <div
              key={index}
              className={cn(
                "w-[2px] rounded-full transition-colors",
                index < activeBarIndex
                  ? isOwn ? "bg-[#F7931E]" : "bg-primary"
                  : isOwn ? "bg-[#F7931E]/40" : "bg-primary/30"
              )}
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>
        
        {/* Time */}
        <div className={cn(
          "text-[10px]",
          isOwn ? "text-[#F7931E]/70" : "text-muted-foreground"
        )}>
          {formatTime(isPlaying ? currentTime : duration)}
        </div>
      </div>
    </div>
  );
};