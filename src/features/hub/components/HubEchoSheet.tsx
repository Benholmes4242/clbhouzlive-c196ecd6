/**
 * HubEchoSheet - Bottom sheet for Echo AI chat
 * 
 * V3: Always shows composer at bottom, uses real AI wiring
 * Layout: Header (fixed) + Body (flex:1) + Composer (anchored bottom)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Send, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEchoConversation } from '@/features/echo/hooks/useEchoConversation';
import type { EchoMessage } from '@/features/echo/state/echoTypes';
import '../home/hubThemeLight.css';

interface HubEchoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

// Prompt chips for quick start
const PROMPT_CHIPS = [
  'Fix my slice',
  'What club from 155y?',
  'Course tips for Portrush',
  'How does stableford work?',
];

export const HubEchoSheet: React.FC<HubEchoSheetProps> = ({
  isOpen,
  onClose,
  initialMessage = '',
}) => {
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [input, setInput] = useState('');
  
  // Use the real Echo conversation hook
  const {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    abortStream,
  } = useEchoConversation({ resetOnMount: true });

  // Complete scroll-lock: save position on open, restore on close
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (isOpen && !wasOpenRef.current) {
      rootScrollTopRef.current = rootEl.scrollTop;
      rootEl.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      rootEl.style.overflow = '';
      rootEl.scrollTop = rootScrollTopRef.current;
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        rootEl.style.overflow = '';
        rootEl.scrollTop = rootScrollTopRef.current;
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  // Reset input when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setInput('');
    }
  }, [isOpen]);

  // Handle initial message on open
  useEffect(() => {
    if (isOpen && initialMessage) {
      setInput(initialMessage);
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 200);
    }
  }, [isOpen, initialMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, streamingContent]);

  // Prevent clicks inside sheet from closing
  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Handle prompt chip click - fill input and focus
  const handleChipClick = useCallback((prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 50);
  }, []);

  // Handle send
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    
    sendMessage(trimmed);
    setInput('');
  }, [input, isStreaming, sendMessage]);

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const hasMessages = messages.length > 0 || isStreaming;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - full viewport, tap to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-[10001]"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />
          
          {/* Sheet - 80% height snap point */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-2xl overflow-hidden flex flex-col overscroll-contain"
            style={{ 
              height: '80vh',
              background: 'var(--hub-bg-start)',
            }}
            onClick={handleSheetClick}
          >
            {/* Header - always visible */}
            <div 
              className="flex-shrink-0"
              style={{ background: 'var(--hub-bg-start)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-black/10" />
              </div>
              
              {/* Title bar with close button */}
              <div 
                className="flex items-center justify-between px-4 pb-3 border-b"
                style={{ 
                  borderColor: 'var(--hub-glass-border)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h2 
                  className="text-[17px] font-semibold"
                  style={{ color: 'var(--hub-text)' }}
                >
                  Echo
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'var(--hub-glass-bg)' }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--hub-text-muted)' }} />
                </button>
              </div>
            </div>
            
            {/* Body - flex:1, scrollable */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain min-h-0"
              style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
            >
              {!hasMessages ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center text-center px-6 pt-8 pb-4" style={{ minHeight: 'calc(100% - 72px)' }}>
                  {/* Icon - subtle watermark feel */}
                  <div className="mb-5">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ 
                        background: 'var(--hub-glass-bg)',
                        opacity: 0.45,
                      }}
                    >
                      <Sparkles 
                        className="w-7 h-7" 
                        style={{ color: 'var(--hub-text-dim)' }} 
                      />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 
                    className="text-[19px] font-semibold mb-2"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    Ask Echo
                  </h3>
                  
                  {/* Subtext */}
                  <p 
                    className="text-[14px] leading-relaxed mb-6"
                    style={{ 
                      color: 'var(--hub-text-sub)',
                      maxWidth: '260px',
                    }}
                  >
                    Tips, course info, rules, or just golf chat — right when you need it.
                  </p>
                  
                  {/* Prompt chips section */}
                  <div className="w-full max-w-[320px]">
                    {/* Label */}
                    <p 
                      className="text-[11px] uppercase tracking-wide mb-2.5"
                      style={{ color: 'var(--hub-text-dim)' }}
                    >
                      Try one of these
                    </p>
                    
                    {/* Chips */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {PROMPT_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleChipClick(chip)}
                          className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all active:scale-[0.97]"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--hub-stroke)',
                            color: 'var(--hub-text-muted)',
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Chat Messages */
                <div className="px-4 py-4 space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  
                  {/* Streaming indicator with partial content */}
                  {isStreaming && (
                    <div className="flex gap-3 justify-start">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--hub-glass-bg)' }}
                      >
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                      </div>
                      <div
                        className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 text-[14px] leading-relaxed"
                        style={{ 
                          background: 'var(--hub-glass-bg)',
                          color: 'var(--hub-text)',
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
              )}
            </div>
            
            {/* Composer - ALWAYS visible, anchored to bottom */}
            <div 
              className="flex-shrink-0 absolute bottom-0 left-0 right-0 px-4 pt-3"
              style={{ 
                background: 'var(--hub-bg-start)',
                borderTop: '1px solid var(--hub-glass-border)',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{
                  background: 'var(--hub-glass-bg)',
                  border: '1px solid var(--hub-stroke)',
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
                    color: 'var(--hub-text)',
                    caretColor: 'var(--hub-text-sub)',
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
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                      "transition-all active:scale-[0.94]",
                      input.trim() ? "opacity-100" : "opacity-40"
                    )}
                    style={{
                      background: 'var(--hub-primary-bg, #1a1a1a)',
                    }}
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// Message bubble component
function MessageBubble({ message }: { message: EchoMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--hub-glass-bg)' }}
        >
          <Sparkles className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
          isUser ? "rounded-br-md" : "rounded-bl-md"
        )}
        style={{
          background: isUser ? 'var(--hub-primary-bg, #1a1a1a)' : 'var(--hub-glass-bg)',
          color: isUser ? 'white' : 'var(--hub-text)',
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
          style={{ background: 'var(--hub-glass-bg)' }}
        >
          <div 
            className="w-4 h-4 rounded-full"
            style={{ background: 'var(--hub-text-dim)' }}
          />
        </div>
      )}
    </div>
  );
}
