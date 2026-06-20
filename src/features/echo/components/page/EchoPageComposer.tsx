/**
 * EchoPageComposer - Light dispatch pill-style input bar
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

export const EchoPageComposer = forwardRef<HTMLTextAreaElement, EchoPageComposerProps>(
  function EchoPageComposer(
    { value, onChange, onSend, onAbort, isStreaming, disabled, cooldown },
    ref
  ) {
    const { isListening, transcript, startListening, stopListening, isSupported, error, micLevel } = useSpeechToText();
    const [isFocused, setIsFocused] = React.useState(false);


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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= MAX_INPUT_LENGTH) {
        onChange(newValue);
      }
    };

    useEffect(() => {
      const el = (ref as React.RefObject<HTMLTextAreaElement>)?.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }, [value, ref]);

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
          borderTop: '0.5px solid rgba(15,23,42,0.07)',
          paddingBottom: 12,
        }}
      >
        {/* Character count */}
        {showCharCount && (
          <div className="flex justify-end mb-1 pr-2">
            <span
              className={cn(
                "text-[11px]",
                charsRemaining <= 50 ? "text-destructive" : ""
              )}
              style={charsRemaining > 50 ? { color: '#94A3B8' } : undefined}
            >
              {charsRemaining}
            </span>
          </div>
        )}

        {/* Live transcript preview while dictating */}
        {isListening && transcript && (
          <div className="mb-1 px-3">
            <p className="text-[12px] italic truncate" style={{ color: '#64748B' }}>
              “{transcript}”
            </p>
          </div>
        )}

        {/* Pill container — reactive amber ring when listening */}
        <div
          className="flex items-end gap-2 rounded-[22px] pl-4 pr-2 py-2 transition-shadow duration-150"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(15,23,42,0.10)',
            boxShadow: isListening
              ? `0 0 0 ${4 + Math.round(micLevel * 12)}px rgba(247,147,30,${(0.12 + micLevel * 0.20).toFixed(3)})`
              : isFocused
                ? '0 0 0 3px rgba(247,147,30,0.12)'
                : 'none',
          }}
        >
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={cooldown ? `Wait ${cooldown}s...` : "Ask Echo..."}
            disabled={disabled}
            aria-label="Type a message to Echo"
            maxLength={MAX_INPUT_LENGTH}
            className="flex-1 bg-transparent outline-none text-[14px] disabled:cursor-not-allowed placeholder:text-[#94A3B8] resize-none leading-snug"
            style={{ color: '#0F172A', caretColor: '#F7931E', maxHeight: 120, overflowY: 'auto' }}
          />

          {/* Send/Stop/Mic button */}
          {isStreaming ? (
            <button
              onClick={handleButtonClick}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-[0.97]"
              style={{ background: 'rgba(15,23,42,0.08)' }}
              aria-label="Stop generating"
            >
              <Square className="w-3.5 h-3.5" style={{ color: '#0F172A', fill: '#0F172A' }} />
            </button>
          ) : canSend ? (
            <button
              onClick={handleButtonClick}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-[0.97]"
              style={{
                background: '#F7931E',
                boxShadow: '0 4px 14px rgba(247,147,30,0.32), inset 0 0 0 0.5px rgba(255,255,255,0.20)',
              }}
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 text-white" />
            </button>
          ) : isSupported ? (
            <button
              onClick={handleMicClick}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-[0.97]"
              )}
              style={isListening
                ? {
                    background: '#F7931E',
                    boxShadow: `0 0 0 ${6 + Math.round(micLevel * 10)}px rgba(247,147,30,${(0.14 + micLevel * 0.18).toFixed(3)})`,
                    transform: `scale(${(1 + micLevel * 0.08).toFixed(3)})`,
                  }
                : { background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.10)' }
              }
              aria-label={isListening ? "Stop listening" : "Voice input"}
            >
              <Mic className="w-4 h-4" style={{ color: isListening ? '#ffffff' : '#94A3B8' }} />
            </button>
          ) : (
            <button
              disabled
              className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent opacity-50"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4" style={{ color: '#94A3B8' }} />
            </button>
          )}
        </div>

      </div>
    );
  }
);
