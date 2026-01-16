/**
 * EchoComposer - Premium input with send button
 * Explicit light glass styling to match Hub sheets
 */

import React, { useEffect, useCallback, forwardRef } from 'react';
import { Send, StopCircle, Loader2 } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { ECHO_GRADIENT_SOLID, ECHO_GLOW } from './echoStyles';

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
      className="absolute bottom-0 left-0 right-0 px-4 pt-3"
      style={{ 
        background: 'linear-gradient(180deg, transparent 0%, #F8FAFC 25%, #F8FAFC 100%)',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-2xl px-4 py-3 bg-white border border-black/8 shadow-sm transition-all",
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
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-[15px]",
            value.trim() ? "text-slate-800" : "text-slate-800 placeholder:text-slate-500"
          )}
          style={{ caretColor: '#f59e0b' }}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
        />
        
        {isStreaming ? (
          <button
            type="button"
            onClick={handleAbort}
            className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 bg-red-500 hover:bg-red-600"
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
              "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
              canSend ? "active:scale-95" : ""
            )}
            style={{
              background: canSend 
                ? ECHO_GRADIENT_SOLID
                : 'rgba(0,0,0,0.05)',
              boxShadow: canSend 
                ? ECHO_GLOW
                : 'none',
              opacity: canSend ? 1 : 0.5,
            }}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
            ) : (
              <Send 
                className="w-4.5 h-4.5" 
                style={{ 
                  color: canSend ? 'white' : 'rgba(15, 23, 42, 0.35)',
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
