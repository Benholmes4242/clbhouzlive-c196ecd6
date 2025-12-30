import { useState, useRef, useEffect } from 'react';
import { Music2, Play, Pause, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSignedAudioUrl } from '@/lib/musicLibrary';

export interface SoundtrackData {
  trackId: string;
  title: string;
  artist?: string;
  r2Key?: string;      // R2 object key - primary source
  url?: string;        // Legacy URL field for backwards compatibility
  startAt?: number;
  volume?: number;
}

interface SoundtrackStripProps {
  music: SoundtrackData;
  variant?: 'preview' | 'published';
  onPlay?: () => void;
  onStop?: () => void;
}

export default function SoundtrackStrip({
  music,
  variant = 'published',
  onPlay,
  onStop,
}: SoundtrackStripProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Resolve the audio URL - prefer r2Key, fallback to legacy url
  const getAudioUrl = (): string => {
    if (music.r2Key) {
      return getSignedAudioUrl(music.r2Key);
    }
    // Fallback for legacy data that might still have url field
    return music.url || '';
  };

  // Create audio element on mount
  useEffect(() => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) {
      console.warn('[SoundtrackStrip] No audio URL available:', { trackId: music.trackId, r2Key: music.r2Key, url: music.url });
      return;
    }

    const audio = new Audio(audioUrl);
    audio.volume = music.volume ?? 0.8;
    audio.currentTime = music.startAt ?? 0;
    audioRef.current = audio;

    // Add error logging
    audio.onerror = (e) => {
      console.error('[SoundtrackStrip] Audio load failed:', {
        trackId: music.trackId,
        r2Key: music.r2Key,
        audioUrl,
        error: e,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message,
      });
    };

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      onStop?.();
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [music.r2Key, music.url, music.volume, music.startAt, onStop]);

  // Stop playback when unmounting (e.g., swiping away)
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        onStop?.();
      }
    };
  }, [onStop]);

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onStop?.();
    } else {
      audioRef.current.play()
        .then(() => {
          console.log('[SoundtrackStrip] Playing:', { trackId: music.trackId, r2Key: music.r2Key });
        })
        .catch((err) => {
          console.error('[SoundtrackStrip] Play failed:', {
            trackId: music.trackId,
            r2Key: music.r2Key,
            error: err.message,
          });
        });
      setIsPlaying(true);
      onPlay?.();
    }
  };

  // Preview variant - just shows the strip without playback
  if (variant === 'preview') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: 'var(--cm-surface-alt)',
          border: '1px solid var(--cm-border-subtle)',
        }}
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--cm-surface-slate)' }}
        >
          <Music2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p 
            className="text-sm font-medium truncate"
            style={{ color: 'var(--cm-text-primary)' }}
          >
            {music.title}
          </p>
          {music.artist && (
            <p 
              className="text-xs truncate"
              style={{ color: 'var(--cm-text-secondary)' }}
            >
              {music.artist}
            </p>
          )}
        </div>
        <Volume2 
          className="w-4 h-4 flex-shrink-0" 
          style={{ color: 'var(--cm-text-tertiary)' }} 
        />
      </motion.div>
    );
  }

  // Published variant - with playback controls
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={togglePlayback}
    >
      <button
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{ 
          background: isPlaying ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)' 
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {music.title}
        </p>
        {music.artist && (
          <p className="text-xs text-white/70 truncate">
            {music.artist}
          </p>
        )}
      </div>
      
      {/* Animated music bars when playing */}
      {isPlaying && (
        <div className="flex items-end gap-0.5 h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-white rounded-full"
              animate={{
                height: ['4px', '16px', '8px', '12px', '4px'],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
