/**
 * EchoComposer - Input bar with orange send button
 * White input with orange accent button
 */

import React, { useEffect, useCallback, forwardRef } from 'react';
import { Send, StopCircle, Loader2 } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { ECHO_ORANGE } from './echoStyles';

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
      className="flex-none px-5 pt-3 bg-[#F8FAFC]"
      style={{ 
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className={cn(
          "flex items-center gap-3 h-[52px] bg-white border border-[#E5E5EA] rounded-[14px] px-4 shadow-sm transition-all duration-200",
          "focus-within:border-[#FFBF66] focus-within:shadow-[0_0_0_3px_rgba(255,191,102,0.1)]",
          disabled && "opacity-60"
        )}
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={cooldown ? `Wait ${cooldown}s...` : placeholder}
          disabled={isStreaming || disabled}
          className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#AEAEB2]"
          style={{ caretColor: ECHO_ORANGE }}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
        />
        
        {isStreaming ? (
          <button
            type="button"
            onClick={handleAbort}
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all active:scale-95 bg-red-500 hover:bg-red-600"
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
              "w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all duration-200",
              canSend ? "active:scale-95" : "cursor-not-allowed"
            )}
            style={{
              backgroundColor: canSend ? ECHO_ORANGE : '#E5E5EA',
            }}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin text-white" />
            ) : (
              <Send 
                className="w-[18px] h-[18px]" 
                style={{ 
                  color: canSend ? 'white' : '#86868B',
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
