/**
 * EchoPageComposer - Fixed bottom input bar for full-page Echo
 */

import React, { forwardRef } from 'react';
import { Send, Square } from 'lucide-react';
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
            "flex items-center gap-3 h-[52px] bg-white border rounded-[14px] px-4 shadow-sm transition-all duration-200",
            disabled 
              ? "border-[#E5E5EA] opacity-60" 
              : "border-[#E5E5EA] focus-within:border-[#FFBF66] focus-within:shadow-[0_0_0_3px_rgba(255,191,102,0.1)]"
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
            className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#AEAEB2] disabled:cursor-not-allowed"
          />

          {/* Send/Stop button */}
          <button
            onClick={handleButtonClick}
            disabled={!isStreaming && !canSend}
            className={cn(
              "w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-200 active:scale-95",
              isStreaming
                ? "bg-red-500 hover:bg-red-600"
                : canSend
                  ? "bg-[#FFBF66] hover:bg-[#FFB04D]"
                  : "bg-[#E5E5EA] cursor-not-allowed"
            )}
            aria-label={isStreaming ? "Stop" : "Send"}
          >
            {isStreaming ? (
              <Square className="w-4 h-4 text-white fill-white" />
            ) : (
              <Send className="w-[18px] h-[18px] text-white" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
