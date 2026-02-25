/**
 * VoiceRecordButton — Animated mic button with pulsing waveform overlay.
 * Press-and-hold records; release transcribes via voice-to-text edge function.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { triggerHaptic } from '@/components/comments/utils';

interface VoiceRecordButtonProps {
  isDark: boolean;
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  isDark,
  onTranscription,
  disabled = false,
}) => {
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording({
    onTranscriptionComplete: onTranscription,
  });

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const [amplitudes, setAmplitudes] = useState<number[]>(Array(5).fill(0.3));

  // Fake waveform animation while recording
  useEffect(() => {
    if (isRecording) {
      setElapsed(0);
      intervalRef.current = window.setInterval(() => {
        setElapsed(prev => prev + 1);
        setAmplitudes(Array(5).fill(0).map(() => 0.2 + Math.random() * 0.8));
      }, 200);
    } else {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setAmplitudes(Array(5).fill(0.3));
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [isRecording]);

  const handlePress = async () => {
    if (disabled || isProcessing) return;
    if (isRecording) {
      triggerHaptic('success');
      stopRecording();
    } else {
      triggerHaptic('light');
      await startRecording();
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex items-center">
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, width: 0, marginRight: 0 }}
            animate={{ opacity: 1, width: 'auto', marginRight: 8 }}
            exit={{ opacity: 0, width: 0, marginRight: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-1.5 overflow-hidden"
          >
            {/* Waveform bars */}
            <div className="flex items-center gap-[3px] h-5">
              {amplitudes.map((amp, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-red-500"
                  animate={{ height: `${amp * 20}px` }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                />
              ))}
            </div>
            <span className={cn(
              "text-[11px] font-mono tabular-nums",
              "text-red-500"
            )}>
              {formatTime(elapsed)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handlePress}
        disabled={disabled || isProcessing}
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-full transition-colors relative",
          isRecording
            ? "text-red-500"
            : isProcessing
              ? "text-amber-500 animate-pulse"
              : isDark
                ? "text-white/40 hover:text-white/60"
                : "text-muted-foreground hover:text-foreground",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {/* Pulsing ring when recording */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-red-500/40"
            />
          )}
        </AnimatePresence>

        <Mic className="w-5 h-5" />
      </motion.button>
    </div>
  );
};
