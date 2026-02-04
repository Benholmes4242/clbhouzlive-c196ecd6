/**
 * EchoPageComposer - Apple-grade input bar for full-page Echo
 */

import React, { forwardRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const handleButtonClick = () => {
      if (isStreaming) {
        onAbort();
      } else {
        onSend();
      }
    };

    const canSend = value.trim().length > 0 && !disabled;

    return (
      <div className="max-w-[640px] mx-auto w-full">
        <div 
          className={cn(
            "flex items-center gap-3 h-[52px] bg-white border rounded-2xl px-4 transition-all duration-200",
            disabled 
              ? "border-[#E5E5EA] opacity-60" 
              : "border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-[#FFBF66] focus-within:shadow-[0_0_0_4px_rgba(255,191,102,0.12)]"
          )}
        >
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={cooldown ? `Wait ${cooldown}s...` : "Ask Echo..."}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-[16px] text-[#1D1D1F] placeholder:text-[#AEAEB2] disabled:cursor-not-allowed"
          />

          {/* Send/Stop button */}
          <button
            onClick={handleButtonClick}
            disabled={!isStreaming && !canSend}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95",
              isStreaming
                ? "bg-[#FFBF66] shadow-sm"
                : canSend
                  ? "bg-[#FFBF66] shadow-sm"
                  : "bg-[#F0F0F5]"
            )}
            aria-label={isStreaming ? "Stop" : "Send"}
          >
            {isStreaming ? (
              <Square className="w-4 h-4 text-white fill-white" />
            ) : (
              <ArrowUp className={cn(
                "w-5 h-5 transition-colors",
                canSend ? "text-white" : "text-[#C7C7CC]"
              )} />
            )}
          </button>
        </div>
      </div>
    );
  }
);
