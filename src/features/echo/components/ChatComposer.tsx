/**
 * Chat Composer Component
 * Input area for sending messages
 */

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, StopCircle } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';

interface ChatComposerProps {
  onSend: (content: string) => void;
  onStop: () => void;
  disabled: boolean;
  isStreaming: boolean;
}

export function ChatComposer({ onSend, onStop, disabled, isStreaming }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    
    haptic('light');
    onSend(trimmed);
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-grow textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Echo..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-secondary text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: '120px' }}
          aria-label="Message input"
        />
        
        {isStreaming ? (
          <TapButton
            onClick={onStop}
            className="bg-destructive text-destructive-foreground p-3 rounded-xl hover:opacity-90 transition-opacity"
            aria-label="Stop generating"
          >
            <StopCircle className="w-5 h-5" />
          </TapButton>
        ) : (
          <TapButton
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="bg-primary text-primary-foreground p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </TapButton>
        )}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
