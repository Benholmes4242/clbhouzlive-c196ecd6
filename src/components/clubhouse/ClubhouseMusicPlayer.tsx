/**
 * ClubhouseMusicPlayer - Auto-playing music for Clubhouse feed
 * 
 * This component automatically plays music when a post with music_only audioMode
 * becomes active in the feed. It handles:
 * - Auto-play when isActive becomes true
 * - Auto-pause when isActive becomes false
 * - Volume control based on studio_edits
 * - Syncing with video playback
 */

import { useEffect, useRef, useState } from 'react';
import { Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSignedAudioUrl } from '@/lib/musicLibrary';


interface MusicData {
  trackId?: string;
  title?: string;
  artist?: string;
  url?: string;
  r2Key?: string;
  startAt?: number;
  volume?: number;
}

interface ClubhouseMusicPlayerProps {
  music: MusicData;
  isActive: boolean;
  isGloballyMuted: boolean;
  postId: string;
}

export function ClubhouseMusicPlayer({
  music,
  isActive,
  isGloballyMuted,
  postId,
}: ClubhouseMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Get audio URL (route through proxy for CORS)
  const getAudioUrl = (): string => {
    const R2_PUBLIC_BASE = 'https://pub-9f6095ba86ef4833a86c1e06bec47b40.r2.dev/';
    const PROXY_BASE = 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/audio-proxy?key=';

    if (music.url) {
      // Already using proxy - return as-is
      if (music.url.includes('/functions/v1/audio-proxy')) {
        return music.url;
      }
      // Legacy direct R2 URL - extract key and route through proxy
      if (music.url.startsWith(R2_PUBLIC_BASE)) {
        const r2Key = decodeURIComponent(music.url.replace(R2_PUBLIC_BASE, ''));
        return `${PROXY_BASE}${encodeURIComponent(r2Key)}`;
      }
      return music.url;
    }

    if (music.r2Key) {
      return getSignedAudioUrl(music.r2Key);
    }

    return '';
  };

  // Create audio element on mount
  useEffect(() => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) return;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.volume = music.volume ?? 0.8;
    audio.loop = true; // Loop music for continuous playback
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      if (music.startAt && music.startAt > 0) {
        audio.currentTime = music.startAt;
      }
    });


    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    
    audio.onerror = () => {
      console.error('[ClubhouseMusicPlayer] Audio load failed:', { postId, audioUrl });
      setHasError(true);
    };

    audio.src = audioUrl;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [music.url, music.r2Key, music.volume, music.startAt, postId]);

  // Auto-play/pause based on isActive state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive && !isGloballyMuted) {
      // Play music when this post becomes active
      audio.play().catch(() => {});
    } else {
      // Pause when not active or globally muted
      audio.pause();
    }
  }, [isActive, isGloballyMuted]);

  // Update volume when mute state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isGloballyMuted;
  }, [isGloballyMuted]);

  if (hasError || !music.title) return null;

  // Visual indicator when music is playing
  return (
    <AnimatePresence>
      {isActive && !isGloballyMuted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/15">
            <Music2 className="w-3.5 h-3.5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {music.title}
            </p>
            {music.artist && (
              <p className="text-[10px] text-white/70 truncate">
                {music.artist}
              </p>
            )}
          </div>
          
          {/* Animated music bars when playing */}
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-white rounded-full"
                  animate={{
                    height: ['3px', '12px', '6px', '10px', '3px'],
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
      )}
    </AnimatePresence>
  );
}
