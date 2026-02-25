/**
 * VoiceNotePlayer — Waveform-based audio player for voice comments.
 * Lazy loads audio on first play, renders amplitude bars, supports speed toggle.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface VoiceNotePlayerProps {
  mediaUrl: string;
  durationSeconds: number;
  commentId: string;
  isDark?: boolean;
}

const BAR_COUNT = 40;
const SPEEDS = [1, 1.5, 2] as const;

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  mediaUrl,
  durationSeconds,
  commentId,
  isDark = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [speedIdx, setSpeedIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const signedUrlRef = useRef<string | null>(null);

  // Generate placeholder amplitudes
  useEffect(() => {
    const amps = Array.from({ length: BAR_COUNT }, () => 0.15 + Math.random() * 0.85);
    setAmplitudes(amps);
  }, [commentId]);

  const getSignedUrl = useCallback(async () => {
    if (signedUrlRef.current) return signedUrlRef.current;
    const { data } = await supabase.storage
      .from('comment-voice-notes')
      .createSignedUrl(mediaUrl, 3600);
    if (data?.signedUrl) {
      signedUrlRef.current = data.signedUrl;
      return data.signedUrl;
    }
    return null;
  }, [mediaUrl]);

  const analyzeAudio = useCallback(async (audioBuffer: AudioBuffer) => {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / BAR_COUNT);
    const amps: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      amps.push(sum / blockSize);
    }
    const maxAmp = Math.max(...amps, 0.01);
    setAmplitudes(amps.map(a => Math.max(0.1, a / maxAmp)));
  }, []);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    setProgress(audio.currentTime / (audio.duration || 1));
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (isLoading) return;

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      return;
    }

    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[speedIdx];
      await audioRef.current.play();
      setIsPlaying(true);
      updateProgress();
      return;
    }

    // First play — lazy load
    setIsLoading(true);
    try {
      const url = await getSignedUrl();
      if (!url) throw new Error('Failed to get audio URL');

      const audio = new Audio(url);
      audio.playbackRate = SPEEDS[speedIdx];
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        cancelAnimationFrame(animFrameRef.current);
      });

      // Try to decode for real waveform
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const decoded = await audioContext.decodeAudioData(arrayBuffer);
        analyzeAudio(decoded);
        audioContext.close();
      } catch {
        // Keep placeholder amplitudes
      }

      await audio.play();
      setIsPlaying(true);
      updateProgress();
    } catch (err) {
      console.error('Voice note playback error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, speedIdx, getSignedUrl, analyzeAudio, updateProgress]);

  const handleSpeedToggle = useCallback(() => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[next];
    }
  }, [speedIdx]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current) {
      audioRef.current.currentTime = ratio * audioRef.current.duration;
      setProgress(ratio);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filledBars = Math.floor(progress * BAR_COUNT);

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-2xl px-3 py-2 my-1",
      isDark ? "bg-white/8" : "bg-muted/60"
    )} style={{ height: 48 }}>
      {/* Play/Pause */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handlePlayPause}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isDark ? "bg-white/15 text-white" : "bg-primary/15 text-primary"
        )}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </motion.button>

      {/* Waveform */}
      <div
        className="flex-1 flex items-center gap-[2px] h-6 cursor-pointer"
        onClick={handleSeek}
      >
        {amplitudes.map((amp, i) => (
          <div
            key={i}
            className={cn(
              "w-[2px] rounded-full transition-colors duration-100",
              i < filledBars
                ? "bg-primary"
                : isDark ? "bg-white/25" : "bg-muted-foreground/30"
            )}
            style={{ height: `${Math.max(4, amp * 24)}px` }}
          />
        ))}
      </div>

      {/* Duration */}
      <span className={cn(
        "text-[11px] font-mono tabular-nums flex-shrink-0",
        isDark ? "text-white/50" : "text-muted-foreground"
      )}>
        {formatDuration(durationSeconds)}
      </span>

      {/* Speed toggle */}
      <button
        onClick={handleSpeedToggle}
        className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0",
          isDark ? "bg-white/10 text-white/60" : "bg-muted text-muted-foreground"
        )}
      >
        {SPEEDS[speedIdx]}x
      </button>
    </div>
  );
};
