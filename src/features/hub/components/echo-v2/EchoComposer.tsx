/**
 * EchoComposer - Premium input with send button
 * Warm styling to match Hub sheets
 */

import React, { useEffect, useCallback, forwardRef } from 'react';
import { Send, StopCircle, Loader2 } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface EchoComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAbort: () => void;
  isStreaming: boolean;
  isSending?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  cooldown?: number | null;
}

export const EchoComposer = forwardRef<HTMLInputElement, EchoComposerProps>(({
  value,
  onChange,
  onSend,
  onAbort,
  isStreaming,
  isSending,
  placeholder = 'Ask Echo...',
  autoFocus,
  disabled,
  cooldown,
}, ref) => {
  useEffect(() => {
    if (autoFocus && ref && 'current' in ref && ref.current) {
      setTimeout(() => {
        ref.current?.focus({ preventScroll: true });
      }, 300);
    }
  }, [autoFocus, ref]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming && !disabled) {
        haptic('medium');
        onSend();
      }
    }
  }, [value, isStreaming, onSend, disabled]);

  const handleSend = useCallback(() => {
    if (value.trim() && !isStreaming && !disabled) {
      haptic('medium');
      onSend();
    }
  }, [value, isStreaming, onSend, disabled]);

  const handleAbort = useCallback(() => {
    haptic('light');
    onAbort();
  }, [onAbort]);

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 px-5 pt-3"
      style={{ 
        background: 'linear-gradient(180deg, transparent 0%, #FFFAF5 25%, #FFFAF5 100%)',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className={cn(
          "flex items-center gap-3 h-[50px] bg-white border border-[#E8E0D8] rounded-[14px] px-4 transition-colors duration-200",
          disabled && "opacity-60",
          !disabled && "focus-within:border-[#FFBF66]"
        )}
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={cooldown ? `Wait ${cooldown}s...` : placeholder}
          disabled={isStreaming || disabled}
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#AEAEB2]"
          style={{ caretColor: '#FFBF66' }}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
        />
        
        {isStreaming ? (
          <button
            type="button"
            onClick={handleAbort}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 bg-red-500 hover:bg-red-600"
            style={{ boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)' }}
            aria-label="Stop"
          >
            <StopCircle className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
              canSend 
                ? "bg-[#FFBF66] active:scale-95" 
                : "bg-[#F0E6DC] opacity-40"
            )}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send 
                className="w-5 h-5" 
                style={{ 
                  color: canSend ? 'white' : '#86868B',
                  marginLeft: canSend ? '1px' : '0',
                }} 
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

EchoComposer.displayName = 'EchoComposer';
