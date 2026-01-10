/**
 * EchoComposer - Premium input with send button
 */

import React, { useRef, useEffect, useCallback } from 'react';
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

export function EchoComposer({
  value,
  onChange,
  onSend,
  onAbort,
  isStreaming,
  isSending,
  placeholder = 'Ask Echo...',
  autoFocus,
}: EchoComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 300);
    }
  }, [autoFocus]);

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
        background: 'linear-gradient(180deg, transparent 0%, rgba(248, 250, 252, 0.95) 20%, rgba(248, 250, 252, 1) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="flex items-center gap-2 rounded-full px-4 py-2.5"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className="flex-1 bg-transparent border-none outline-none text-[15px]"
          style={{ 
            color: '#1e293b',
            caretColor: '#a855f7',
          }}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
        />
        
        {isStreaming ? (
          <button
            type="button"
            onClick={handleAbort}
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
            style={{ 
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
            }}
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
                ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                : 'rgba(0, 0, 0, 0.08)',
              boxShadow: canSend ? '0 2px 8px rgba(168, 85, 247, 0.35)' : 'none',
            }}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4" style={{ color: canSend ? 'white' : '#94a3b8' }} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
