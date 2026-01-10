/**
 * EchoComposer - Premium input with send button
 * Uses design tokens for theming
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
        background: 'linear-gradient(180deg, transparent 0%, hsl(var(--background) / 0.95) 20%, hsl(var(--background)) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="flex items-center gap-2 rounded-full px-4 py-2.5 bg-card border border-border/50"
        style={{
          boxShadow: '0 4px 16px hsl(var(--foreground) / 0.04), 0 1px 3px hsl(var(--foreground) / 0.02)',
        }}
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
          style={{ caretColor: 'hsl(var(--echo-accent, 270 60% 60%))' }}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
        />
        
        {isStreaming ? (
          <button
            type="button"
            onClick={handleAbort}
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 bg-destructive"
            style={{ boxShadow: '0 2px 8px hsl(var(--destructive) / 0.3)' }}
            aria-label="Stop"
          >
            <StopCircle className="w-5 h-5 text-destructive-foreground" />
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
                : 'hsl(var(--muted))',
              boxShadow: canSend ? '0 2px 8px hsl(var(--echo-accent, 270 60% 60%) / 0.35)' : 'none',
            }}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4" style={{ color: canSend ? 'white' : 'hsl(var(--muted-foreground))' }} />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

EchoComposer.displayName = 'EchoComposer';
