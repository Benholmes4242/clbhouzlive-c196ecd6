/**
 * HubEchoSheet - Bottom sheet for Echo AI chat
 * 
 * V1: Fully self-contained chat experience
 * - No navigation to external pages
 * - Local messages state with mock responses
 * - Empty state → Chat thread transition
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import '../home/hubThemeLight.css';

interface HubEchoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

// Message type
type EchoMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
};

// Prompt chips for quick start
const PROMPT_CHIPS = [
  'Fix my slice',
  'What club from 155y?',
  'Course tips for Portrush',
  'How does stableford work?',
];

// Mock responses for V1
const MOCK_RESPONSES: Record<string, string> = {
  'fix my slice': "A slice usually comes from an open clubface at impact. Try these fixes:\n\n1. **Strengthen your grip** — rotate both hands slightly clockwise\n2. **Check your alignment** — shoulders may be aiming left\n3. **Swing inside-out** — feel like you're hitting toward right field\n\nPractice with half-swings first to groove the new path.",
  'what club from 155y?': "From 155 yards, most amateurs would hit a **6 or 7 iron**. But it depends on your game:\n\n• **Strong hitter**: 7 iron or even 8\n• **Average**: 6 iron\n• **Smooth swinger**: 5 iron or hybrid\n\nConsider wind, elevation, and whether the pin is front or back.",
  'course tips for portrush': "Royal Portrush is a proper links test. Key tips:\n\n1. **Play for the wind** — it's always a factor\n2. **Calamity Corner (14th)** — aim well right of the cliffs\n3. **Use the ground** — bump and run around greens\n4. **Stay below the hole** — greens are slick\n\nBook a caddie if you can — local knowledge is invaluable.",
  'how does stableford work?': "Stableford awards points based on your score relative to par:\n\n• **Albatross (3 under)**: 5 points\n• **Eagle (2 under)**: 4 points\n• **Birdie (1 under)**: 3 points\n• **Par**: 2 points\n• **Bogey (1 over)**: 1 point\n• **Double bogey or worse**: 0 points\n\nHighest total wins. Great format because one bad hole doesn't ruin your round!",
};

const getDefaultResponse = (query: string): string => {
  return `Great question about "${query}"! I'm still learning, but here's what I know:\n\nThis is a mock response for V1. The full Echo AI will provide detailed, personalized golf advice here.\n\nTry asking about:\n• Swing tips\n• Club selection\n• Course strategy\n• Rules of golf`;
};

const getMockResponse = (query: string): string => {
  const normalizedQuery = query.toLowerCase().trim();
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return response;
    }
  }
  return getDefaultResponse(query);
};

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
  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

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

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setMessages([]);
      setIsTyping(false);
    }
  }, [isOpen]);

  // Handle initial message on open
  useEffect(() => {
    if (isOpen && initialMessage) {
      setInput(initialMessage);
      // Auto-focus when there's an initial message
      setTimeout(() => {
        try {
          inputRef.current?.focus({ preventScroll: true });
        } catch {
          inputRef.current?.focus();
        }
      }, 200);
    }
  }, [isOpen, initialMessage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Prevent clicks inside sheet from closing
  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Handle prompt chip click - fill input and focus (stay in sheet)
  const handleChipClick = useCallback((prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      try {
        inputRef.current?.focus({ preventScroll: true });
      } catch {
        inputRef.current?.focus();
      }
    }, 50);
  }, []);

  // Handle send - stay in sheet, add to local messages
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    
    // Add user message
    const userMessage: EchoMessage = {
      id: nanoid(),
      role: 'user',
      text: trimmed,
      ts: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate assistant response after delay
    setTimeout(() => {
      const assistantMessage: EchoMessage = {
        id: nanoid(),
        role: 'assistant',
        text: getMockResponse(trimmed),
        ts: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  }, [input, isTyping]);

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const hasMessages = messages.length > 0;

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
            {/* Header - always visible, sticky */}
            <div 
              className="flex-shrink-0 sticky top-0 z-10"
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
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
              {!hasMessages ? (
                /* Empty State - centered with breathing room */
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 -mt-8">
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
                <div className="flex-1 px-4 py-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === 'assistant' && (
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
                          msg.role === 'user' 
                            ? "rounded-br-md" 
                            : "rounded-bl-md"
                        )}
                        style={{
                          background: msg.role === 'user' 
                            ? 'var(--hub-primary-bg, #1a1a1a)' 
                            : 'var(--hub-glass-bg)',
                          color: msg.role === 'user' 
                            ? 'white' 
                            : 'var(--hub-text)',
                        }}
                      >
                        {msg.text.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i < msg.text.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                      
                      {msg.role === 'user' && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--hub-glass-bg)' }}
                        >
                          <User className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--hub-glass-bg)' }}
                      >
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                      </div>
                      <div
                        className="rounded-2xl rounded-bl-md px-4 py-3"
                        style={{ background: 'var(--hub-glass-bg)' }}
                      >
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" style={{ color: 'var(--hub-text-dim)' }} />
                          <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" style={{ color: 'var(--hub-text-dim)', animationDelay: '0.15s' }} />
                          <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" style={{ color: 'var(--hub-text-dim)', animationDelay: '0.3s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input Bar - anchored bottom, keyboard-safe */}
            <div 
              className="flex-shrink-0 px-4 pt-3"
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
                  disabled={isTyping}
                  className="flex-1 bg-transparent border-none outline-none text-[15px]"
                  style={{ 
                    color: 'var(--hub-text)',
                    caretColor: 'var(--hub-text-sub)',
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  enterKeyHint="send"
                />
                
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    "transition-all active:scale-[0.94]",
                    input.trim() && !isTyping
                      ? "opacity-100"
                      : "opacity-40"
                  )}
                  style={{
                    background: input.trim() && !isTyping
                      ? 'var(--hub-primary-bg, #1a1a1a)' 
                      : 'var(--hub-glass-bg-subtle)',
                    border: input.trim() && !isTyping
                      ? 'none' 
                      : '1px solid var(--hub-stroke)',
                  }}
                  aria-label="Send"
                >
                  <Send 
                    className="h-4 w-4" 
                    style={{ 
                      color: input.trim() && !isTyping ? 'white' : 'var(--hub-text-dim)' 
                    }} 
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HubEchoSheet;
