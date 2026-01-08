/**
 * EchoChatSurface - Shared chat UI component
 * 
 * Renders the full chat experience: messages, streaming, composer
 * Reuses the existing useEchoConversation hook for real AI responses
 * Can be embedded in sheets, pages, or any container
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Sparkles, User, Send, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEchoConversation } from '../hooks/useEchoConversation';
import type { EchoMessage } from '../state/echoTypes';

interface EchoChatSurfaceProps {
  /** Initial message to pre-fill the input */
  initialMessage?: string;
  /** Called when chat becomes active (first message sent) */
  onChatStarted?: () => void;
  /** Custom styling for the container */
  className?: string;
  /** Use Hub theme styling (light mode) */
  hubTheme?: boolean;
}

export interface EchoChatSurfaceRef {
  sendMessage: (content: string) => void;
  focus: () => void;
}

export const EchoChatSurface = forwardRef<EchoChatSurfaceRef, EchoChatSurfaceProps>(({
  initialMessage = '',
  onChatStarted,
  className,
  hubTheme = false,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasNotifiedChatStarted = useRef(false);
  
  const {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    abortStream,
  } = useEchoConversation({ resetOnMount: true });

  const [input, setInput] = React.useState(initialMessage);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    sendMessage: (content: string) => {
      handleSend(content);
    },
    focus: () => {
      inputRef.current?.focus({ preventScroll: true });
    },
  }), []);

  // Update input when initialMessage changes
  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
    }
  }, [initialMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, streamingContent]);

  // Notify when chat starts
  useEffect(() => {
    if (messages.length > 0 && !hasNotifiedChatStarted.current) {
      hasNotifiedChatStarted.current = true;
      onChatStarted?.();
    }
  }, [messages, onChatStarted]);

  const handleSend = (content?: string) => {
    const text = (content ?? input).trim();
    if (!text || isStreaming) return;
    
    sendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0 || isStreaming;

  // Style helpers for Hub theme
  const getStyles = () => {
    if (hubTheme) {
      return {
        messageBg: {
          user: 'var(--hub-primary-bg, #1a1a1a)',
          assistant: 'var(--hub-glass-bg)',
        },
        messageColor: {
          user: 'white',
          assistant: 'var(--hub-text)',
        },
        iconBg: 'var(--hub-glass-bg)',
        iconColor: 'var(--hub-text-dim)',
        inputBg: 'var(--hub-glass-bg)',
        inputBorder: 'var(--hub-stroke)',
        textColor: 'var(--hub-text)',
        mutedColor: 'var(--hub-text-sub)',
      };
    }
    return {
      messageBg: {
        user: 'hsl(var(--primary))',
        assistant: 'hsl(var(--secondary))',
      },
      messageColor: {
        user: 'hsl(var(--primary-foreground))',
        assistant: 'hsl(var(--secondary-foreground))',
      },
      iconBg: 'hsl(var(--secondary))',
      iconColor: 'hsl(var(--muted-foreground))',
      inputBg: 'hsl(var(--secondary))',
      inputBorder: 'hsl(var(--border))',
      textColor: 'hsl(var(--foreground))',
      mutedColor: 'hsl(var(--muted-foreground))',
    };
  };

  const styles = getStyles();

  return (
    <div className={cn("flex flex-col min-h-0 flex-1", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            styles={styles}
            hubTheme={hubTheme}
          />
        ))}
        
        {/* Streaming indicator with partial content */}
        {isStreaming && (
          <div className="flex gap-3 justify-start">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: styles.iconBg }}
            >
              <Sparkles className="w-4 h-4" style={{ color: styles.iconColor }} />
            </div>
            <div
              className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 text-[14px] leading-relaxed"
              style={{ 
                background: styles.messageBg.assistant,
                color: styles.messageColor.assistant,
              }}
            >
              {streamingContent ? (
                <div className="whitespace-pre-wrap">
                  {streamingContent}
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-current opacity-60 animate-pulse" />
                </div>
              ) : (
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" style={{ animationDelay: '0.15s' }} />
                  <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Composer - anchored bottom */}
      <div 
        className="flex-shrink-0 px-4 pt-3"
        style={{ 
          background: hubTheme ? 'var(--hub-bg-start)' : 'hsl(var(--background))',
          borderTop: `1px solid ${hubTheme ? 'var(--hub-glass-border)' : 'hsl(var(--border))'}`,
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: styles.inputBg,
            border: `1px solid ${styles.inputBorder}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Echo..."
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none outline-none text-[15px]"
            style={{ 
              color: styles.textColor,
              caretColor: styles.mutedColor,
            }}
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="send"
          />
          
          {isStreaming ? (
            <button
              type="button"
              onClick={abortStream}
              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-[0.94]"
              style={{ background: 'hsl(var(--destructive))' }}
              aria-label="Stop"
            >
              <StopCircle className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                "transition-all active:scale-[0.94]",
                input.trim() ? "opacity-100" : "opacity-40"
              )}
              style={{
                background: hubTheme ? 'var(--hub-primary-bg, #1a1a1a)' : 'hsl(var(--primary))',
              }}
              aria-label="Send"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

EchoChatSurface.displayName = 'EchoChatSurface';

// Style types
interface ChatStyles {
  messageBg: { user: string; assistant: string };
  messageColor: { user: string; assistant: string };
  iconBg: string;
  iconColor: string;
  inputBg: string;
  inputBorder: string;
  textColor: string;
  mutedColor: string;
}

// Message bubble component
interface MessageBubbleProps {
  message: EchoMessage;
  styles: ChatStyles;
  hubTheme: boolean;
}

function MessageBubble({ message, styles, hubTheme }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: styles.iconBg }}
        >
          <Sparkles className="w-4 h-4" style={{ color: styles.iconColor }} />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
          isUser ? "rounded-br-md" : "rounded-bl-md"
        )}
        style={{
          background: isUser ? styles.messageBg.user : styles.messageBg.assistant,
          color: isUser ? styles.messageColor.user : styles.messageColor.assistant,
        }}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.meta?.error && (
          <div className="mt-2 text-xs text-red-500">
            Error: {message.meta.error}
          </div>
        )}
      </div>
      
      {isUser && (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: styles.iconBg }}
        >
          <User className="w-4 h-4" style={{ color: styles.iconColor }} />
        </div>
      )}
    </div>
  );
}
