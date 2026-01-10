/**
 * EchoComposer - Premium input with send button
 * Explicit light glass styling to match Hub sheets
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
      if (value.trim() && !isStreaming) {
        haptic('medium');
        onSend();
      }
    }
  }, [value, isStreaming, onSend]);

  const handleSend = useCallback(() => {
    if (value.trim() && !isStreaming) {
      haptic('medium');
      onSend();
    }
  }, [value, isStreaming, onSend]);

  const handleAbort = useCallback(() => {
    haptic('light');
    onAbort();
  }, [onAbort]);

  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 px-4 pt-3"
      style={{ 
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,1) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="flex items-center gap-2 rounded-full px-4 py-2.5 bg-white/85 border border-black/10 shadow-sm"
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-slate-900 placeholder:text-slate-500"
          style={{ caretColor: 'hsl(var(--echo-accent, 270 60% 60%))' }}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
        />
        
        {isStreaming ? (
          <button
            type="button"
            onClick={handleAbort}
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 bg-red-500"
            style={{ boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)' }}
            aria-label="Stop"
          >
            <StopCircle className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
            style={{
              background: canSend 
                ? `${ECHO_ORANGE}24`
                : 'rgba(0,0,0,0.04)',
              border: canSend 
                ? `1px solid ${ECHO_ORANGE}4D`
                : '1px solid rgba(0,0,0,0.08)',
              opacity: canSend ? 1 : 0.55,
            }}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: ECHO_ORANGE }} />
            ) : (
              <Send className="w-4 h-4" style={{ color: canSend ? ECHO_ORANGE : 'rgba(15, 23, 42, 0.45)' }} />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

EchoComposer.displayName = 'EchoComposer';
