/**
 * EchoPageComposer - Cleo glass-style pill input bar
 * With voice input, character limit, and full accessibility
 */

import React, { forwardRef, useEffect } from 'react';
import { ArrowUp, Square, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { ECHO_LIMITS } from '@/features/echo/constants/echoTheme';

interface EchoPageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAbort: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  cooldown?: number | null;
}

export const EchoPageComposer = forwardRef<HTMLInputElement, EchoPageComposerProps>(
  function EchoPageComposer(
    { value, onChange, onSend, onAbort, isStreaming, disabled, cooldown },
    ref
  ) {
    const { isListening, transcript, startListening, stopListening, isSupported, error } = useSpeechToText();

    useEffect(() => {
      if (transcript) {
        onChange(transcript);
      }
    }, [transcript, onChange]);

    useEffect(() => {
      if (error) {
        toast.error(error);
      }
    }, [error]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isStreaming) {
          onAbort();
        } else {
          onSend();
        }
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= ECHO_LIMITS.maxInputLength) {
        onChange(newValue);
      }
    };

    const handleButtonClick = () => {
      if (isStreaming) {
        haptic('medium');
        onAbort();
      } else if (canSend) {
        haptic('light');
        onSend();
      }
    };

    const handleMicClick = () => {
      if (isListening) {
        stopListening();
      } else {
        haptic('light');
        startListening();
      }
    };

    const canSend = value.trim().length > 0 && !disabled;
    const charsRemaining = ECHO_LIMITS.maxInputLength - value.length;
    const showCharCount = charsRemaining <= ECHO_LIMITS.warningThreshold;

    return (
      <div 
        className="relative flex items-center gap-2 h-[50px] rounded-[22px] px-[14px]"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(217,119,6,0.12)',
        }}
      >
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={cooldown ? `Wait ${cooldown}s...` : "Ask Echo..."}
          disabled={disabled}
          aria-label="Type a message to Echo"
          maxLength={ECHO_LIMITS.maxInputLength}
          className="flex-1 bg-transparent outline-none text-[13px] disabled:cursor-not-allowed"
          style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}
        />

        {/* Placeholder style override */}
        <style>{`
          .echo-composer-input::placeholder { color: #A8A29E; opacity: 1; }
        `}</style>

        {showCharCount && (
          <span 
            className={cn(
              "absolute right-14 text-[0.6875rem]",
              charsRemaining <= 50 ? "text-red-500" : "opacity-50"
            )}
            style={{ color: charsRemaining <= 50 ? undefined : '#A8A29E' }}
          >
            {charsRemaining}
          </span>
        )}

        {/* Send/Stop/Mic button */}
        {isStreaming ? (
          <button
            onClick={handleButtonClick}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ backgroundColor: '#F59E0B' }}
            aria-label="Stop generating"
          >
            <Square className="w-3.5 h-3.5 text-white fill-white" />
          </button>
        ) : canSend ? (
          <button
            onClick={handleButtonClick}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ backgroundColor: '#F59E0B' }}
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4 text-white" />
          </button>
        ) : isSupported ? (
          <button
            onClick={handleMicClick}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95",
              isListening && "animate-pulse"
            )}
            style={{ backgroundColor: isListening ? '#EF4444' : '#F59E0B' }}
            aria-label={isListening ? "Stop listening" : "Voice input"}
          >
            <Mic className="w-4 h-4 text-white" />
          </button>
        ) : (
          <button
            disabled
            className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent opacity-50"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" style={{ color: '#A8A29E' }} />
          </button>
        )}
      </div>
    );
  }
);
