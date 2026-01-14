/**
 * EchoComposer - Premium input with send/stop button
 * Polished with proper disabled states and accessibility
 */

import React, { useEffect, useCallback, forwardRef } from 'react';
import { Send, StopCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { ECHO_ORANGE, ECHO_ORANGE_DARK } from './echoStyles';

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
      className="absolute bottom-0 left-0 right-0 px-4 pt-4"
      style={{ 
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.92) 25%, rgba(255,255,255,0.98) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl px-4 py-3",
          "bg-white/90 border border-black/8 shadow-lg shadow-black/5",
          "transition-all duration-150",
          isStreaming ? "opacity-75" : "focus-within:border-amber-500/30 focus-within:shadow-amber-500/10"
        )}
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-[15px] text-slate-900 placeholder:text-slate-400",
            isStreaming && "cursor-not-allowed"
          )}
          style={{ caretColor: ECHO_ORANGE }}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
          aria-label="Message Echo"
        />
        
        {isStreaming ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            type="button"
            onClick={handleAbort}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 bg-red-500 hover:bg-red-600"
            style={{ boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)' }}
            aria-label="Stop generating"
          >
            <StopCircle className="w-5 h-5 text-white" />
          </motion.button>
        ) : (
          <motion.button
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150",
              canSend 
                ? "active:scale-95" 
                : "cursor-not-allowed"
            )}
            style={{
              background: canSend 
                ? `linear-gradient(145deg, ${ECHO_ORANGE} 0%, ${ECHO_ORANGE_DARK} 100%)`
                : 'rgba(0,0,0,0.05)',
              boxShadow: canSend 
                ? `0 2px 8px ${ECHO_ORANGE}40`
                : 'none',
              opacity: canSend ? 1 : 0.5,
            }}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send 
                className="w-5 h-5" 
                style={{ color: canSend ? 'white' : 'rgba(15, 23, 42, 0.35)' }}
              />
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
});

EchoComposer.displayName = 'EchoComposer';
