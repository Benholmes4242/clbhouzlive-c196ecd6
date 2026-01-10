/**
 * EchoComposer - Premium input with send button
 * Explicit light glass styling to match Hub sheets
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
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
              "transition-all active:scale-95",
              canSend ? "opacity-100" : "opacity-30"
            )}
            style={{
              background: canSend 
                ? 'linear-gradient(135deg, hsl(var(--echo-accent, 270 60% 60%)) 0%, hsl(var(--echo-accent-dark, 262 83% 58%)) 100%)'
                : 'rgb(226, 232, 240)',
              boxShadow: canSend ? '0 2px 8px hsl(var(--echo-accent, 270 60% 60%) / 0.35)' : 'none',
            }}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4" style={{ color: canSend ? 'white' : 'rgb(148, 163, 184)' }} />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

EchoComposer.displayName = 'EchoComposer';
