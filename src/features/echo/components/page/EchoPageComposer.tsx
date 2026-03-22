/**
 * EchoPageComposer - Clean pill-style input bar
 */

import React, { forwardRef, useEffect } from 'react';
import { ArrowUp, Square, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';

const MAX_INPUT_LENGTH = 2000;
const WARNING_THRESHOLD = 200;

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
      if (newValue.length <= MAX_INPUT_LENGTH) {
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
    const charsRemaining = MAX_INPUT_LENGTH - value.length;
    const showCharCount = charsRemaining <= WARNING_THRESHOLD;

    return (
      <div
        className="flex-none px-4 py-3"
        style={{
          background: '#F8FAFC',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 12px)',
        }}
      >
        {/* Character count */}
        {showCharCount && (
          <div className="flex justify-end mb-1 pr-2">
            <span
              className={cn(
                "text-[11px]",
                charsRemaining <= 50 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {charsRemaining}
            </span>
          </div>
        )}

        {/* Pill container */}
        <div
          className="flex items-center gap-2 rounded-full pl-4 pr-2 py-2"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
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
            maxLength={MAX_INPUT_LENGTH}
            className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />

          {/* Send/Stop/Mic button */}
          {isStreaming ? (
            <button
              onClick={handleButtonClick}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-[0.97] bg-foreground"
              aria-label="Stop generating"
            >
              <Square className="w-3.5 h-3.5 text-background fill-background" />
            </button>
          ) : canSend ? (
            <button
              onClick={handleButtonClick}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-[0.97] bg-[hsl(38,92%,50%)]"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 text-white" />
            </button>
          ) : isSupported ? (
            <button
              onClick={handleMicClick}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-[0.97]",
                isListening && "animate-pulse bg-destructive border-destructive"
              )}
              style={!isListening ? {
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.07)',
              } : undefined}
              aria-label={isListening ? "Stop listening" : "Voice input"}
            >
              <Mic className={cn("w-4 h-4", isListening ? "text-white" : "text-muted-foreground")} />
            </button>
          ) : (
            <button
              disabled
              className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent opacity-50"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
