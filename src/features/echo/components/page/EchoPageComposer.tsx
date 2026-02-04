/**
 * EchoPageComposer - WhatsApp-style pill input bar
 */

import React, { forwardRef } from 'react';
import { ArrowUp, Square, Mic } from 'lucide-react';
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
      <div className="flex items-center gap-2 h-[50px] bg-white rounded-full px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={cooldown ? `Wait ${cooldown}s...` : "Ask Echo..."}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#8E8E93] disabled:cursor-not-allowed"
        />

        {/* Send/Stop button */}
        <button
          onClick={handleButtonClick}
          disabled={!isStreaming && !canSend}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95",
            isStreaming
              ? "bg-[#FFBF66]"
              : canSend
                ? "bg-[#FFBF66]"
                : "bg-transparent"
          )}
          aria-label={isStreaming ? "Stop" : "Send"}
        >
          {isStreaming ? (
            <Square className="w-4 h-4 text-white fill-white" />
          ) : canSend ? (
            <ArrowUp className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-[#8E8E93]" />
          )}
        </button>
      </div>
    );
  }
);
