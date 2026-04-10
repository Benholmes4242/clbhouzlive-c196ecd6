import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Trash2 } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { AppLog } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface VoiceRecordButtonProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
}

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onSend,
  disabled = false,
}) => {
  const {
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
    error,
  } = useVoiceRecorder();

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const startXRef = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const CANCEL_THRESHOLD = -100;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    startRecording();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRecording) return;
    const diff = e.touches[0].clientX - startXRef.current;
    setSwipeOffset(Math.min(0, diff));
  };

  const handleTouchEnd = () => {
    if (!isRecording) return;
    
    if (swipeOffset < CANCEL_THRESHOLD) {
      cancelRecording();
    } else {
      stopRecording();
      setShowPreview(true);
    }
    setSwipeOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    startXRef.current = e.clientX;
    startRecording();
    
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current;
      setSwipeOffset(Math.min(0, diff));
    };
    
    const handleMouseUp = () => {
      if (swipeOffset < CANCEL_THRESHOLD) {
        cancelRecording();
      } else {
        stopRecording();
        setShowPreview(true);
      }
      setSwipeOffset(0);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
      setShowPreview(false);
      resetRecording();
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    resetRecording();
  };

  // Show error toast
  useEffect(() => {
    if (error) {
      AppLog.error('[VoiceRecordButton]', 'Voice recording error:', error);
    }
  }, [error]);

  // Preview mode after recording
  if (showPreview && audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
        <button
          onClick={handleCancel}
          className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          aria-label="Delete recording"
        >
          <Trash2 size={18} />
        </button>
        
        <audio src={audioUrl} controls className="h-8 flex-1 max-w-[120px]" />
        
        <span className="text-xs text-muted-foreground min-w-[36px]">
          {formatDuration(duration)}
        </span>
        
        <button
          onClick={handleSend}
          className="p-2 text-white rounded-full transition-colors active:scale-[0.97]"
          style={{ background: '#F7931E' }}
          aria-label="Send voice note"
        >
          <Send size={18} />
        </button>
      </div>
    );
  }

  // Recording mode
  if (isRecording) {
    return (
      <div 
        className="flex items-center gap-3 bg-destructive/10 rounded-full px-4 py-2 select-none"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {/* Cancel hint */}
        <div className={cn(
          "flex items-center gap-1 text-sm transition-opacity",
          swipeOffset < CANCEL_THRESHOLD / 2 ? "opacity-100 text-destructive" : "opacity-50 text-muted-foreground"
        )}>
          <X size={16} />
          <span className="text-xs">Slide to cancel</span>
        </div>
        
        {/* Recording indicator */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium text-destructive">
            {formatDuration(duration)}
          </span>
        </div>
        
        {/* Mic button (visual only during recording) */}
        <div className="p-2 bg-destructive text-destructive-foreground rounded-full">
          <Mic size={18} />
        </div>
      </div>
    );
  }

  // Default mic button
  return (
    <button
      ref={buttonRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      disabled={disabled}
      className={cn(
        "p-2.5 rounded-full transition-all flex-shrink-0",
        "text-muted-foreground hover:text-foreground hover:bg-muted",
        "active:scale-[0.97] active:bg-[#F7931E] active:text-white",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title="Hold to record voice note"
      aria-label="Record voice note"
    >
      <Mic size={22} />
    </button>
  );
};