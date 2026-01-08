/**
 * HubEchoSheet - Bottom sheet for Echo AI chat
 * 
 * 80% height snap point for comfortable input
 * Premium default state with prompt chips
 * Keyboard-safe input bar
 * 
 * V1 Behavior:
 * - Chips fill input + focus (don't navigate)
 * - No auto-focus on open (only when user interacts)
 * - Input stays visible above keyboard
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
  const navigate = useNavigate();
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState(initialMessage);

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

  // Clear input when sheet closes, set initial message when opening
  useEffect(() => {
    if (!isOpen) {
      setInput('');
    } else if (initialMessage) {
      setInput(initialMessage);
    }
  }, [isOpen, initialMessage]);

  // Only auto-focus if initialMessage is provided (intentional deep link)
  useEffect(() => {
    if (!isOpen || !initialMessage) return;
    const timer = setTimeout(() => {
      try {
        inputRef.current?.focus({ preventScroll: true });
      } catch {
        inputRef.current?.focus();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isOpen, initialMessage]);

  // Prevent clicks inside sheet from closing
  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Handle prompt chip click - fill input and focus (stay in sheet)
  const handleChipClick = useCallback((prompt: string) => {
    setInput(prompt);
    // Focus the input after filling
    setTimeout(() => {
      try {
        inputRef.current?.focus({ preventScroll: true });
      } catch {
        inputRef.current?.focus();
      }
    }, 50);
  }, []);

  // Focus input when user taps it
  const handleInputFocus = useCallback(() => {
    // Input is already focused by native behavior
  }, []);

  // Handle send - navigate to full Echo page for actual chat
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    onClose();
    setTimeout(() => {
      navigate(`/hub/echo?msg=${encodeURIComponent(trimmed)}`);
    }, 100);
  }, [input, navigate, onClose]);

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

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
            className="fixed inset-0 bg-black/50 z-50"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />
          
          {/* Sheet - 80% height snap point */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl overflow-hidden flex flex-col overscroll-contain"
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
            
            {/* Content - default empty state, optically centered above input */}
            <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
              {/* Empty State - centered with breathing room */}
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
                <div className="w-full max-w-[300px]">
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
                  onFocus={handleInputFocus}
                  placeholder="Ask Echo..."
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
                  disabled={!input.trim()}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    "transition-all active:scale-[0.94]",
                    input.trim()
                      ? "opacity-100"
                      : "opacity-40"
                  )}
                  style={{
                    background: input.trim() 
                      ? 'var(--hub-primary-bg, #1a1a1a)' 
                      : 'var(--hub-glass-bg-subtle)',
                    border: input.trim() 
                      ? 'none' 
                      : '1px solid var(--hub-stroke)',
                  }}
                  aria-label="Send"
                >
                  <Send 
                    className="h-4 w-4" 
                    style={{ 
                      color: input.trim() ? 'white' : 'var(--hub-text-dim)' 
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
