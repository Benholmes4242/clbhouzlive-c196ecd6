/**
 * Hub Echo Chat Page
 * Full-screen glass page with Apple-style chat interface
 */
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Z } from '@/config/zIndex';
import { useEchoConversation } from '@/features/echo/hooks/useEchoConversation';
import { useAutoSendFromQuery } from '@/components/ai-chat/hooks/useAutoSendFromQuery';
import { EchoMessageRow } from '@/features/echo/components/EchoMessageRow';
import { EchoTypingRow } from '@/features/echo/components/EchoTypingRow';
import { EchoContextMenu } from '@/features/echo/components/EchoContextMenu';
import type { EchoMessage } from '@/features/echo/state/echoTypes';
import { haptic } from '@/utils/haptics';
import { useToast } from '@/hooks/use-toast';
import '../home/hubTheme.css';

export function HubEchoChatPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { toast } = useToast();
  
  const [input, setInput] = useState('');
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    message: EchoMessage;
    x: number;
    y: number;
  } | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  const {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    abortStream,
  } = useEchoConversation({ resetOnMount: true });

  // Auto-send from query param (tooltips & Hub search)
  useAutoSendFromQuery(
    (msg) => {
      console.log('[Echo] useAutoSendFromQuery fired with:', msg);
      if (msg?.trim()) {
        void sendMessage(msg.trim());
      }
    },
    { param: 'msg', maxLen: 800, stripOn: 'always' }
  );

  // Apply hub-open class for glass theme
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isStreaming]);

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/hub', { replace: true });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const top = el.scrollTop;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;

    setHasScrolled(top > 12);
    setShowJumpToBottom(!isNearBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    haptic('light');
    setInput('');
    await sendMessage(trimmed);
    setTimeout(scrollToBottom, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openContextMenu = (e: React.MouseEvent | React.TouchEvent, message: EchoMessage) => {
    e.preventDefault();
    const point = 'touches' in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };

    setContextMenu({ message, x: point.x, y: point.y });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleCopy = () => {
    if (!contextMenu) return;
    navigator.clipboard.writeText(contextMenu.message.content);
    toast({ title: 'Copied to clipboard' });
  };

  const handleReply = () => {
    if (!contextMenu) return;
    setInput(`> ${contextMenu.message.content.slice(0, 50)}...\n\n`);
    inputRef.current?.focus();
  };

  const handleShare = () => {
    if (!contextMenu || !navigator.share) {
      toast({ title: 'Sharing not supported' });
      return;
    }
    navigator.share({ text: contextMenu.message.content });
  };

  return (
    <div
      className="hub-glass-page fixed inset-0 flex flex-col"
      style={{
        zIndex: Z.page,
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Header */}
      <header 
        className={cn(
          "relative z-10 fixed top-0 left-0 right-0 flex items-center justify-between px-4 h-14 border-b transition-shadow duration-200",
          hasScrolled ? "shadow-[0_6px_12px_rgba(0,0,0,0.45)]" : "shadow-none"
        )}
        style={{
          zIndex: Z.pageHeader,
          borderColor: 'var(--hub-stroke)',
          background: 'rgba(22, 24, 27, 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <button
          onClick={handleBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back to Hub"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Echo</h1>
        <div className="w-16" />
        
        {/* Thinking shimmer bar */}
        {isStreaming && <div className="echo-thinking-bar" />}
      </header>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        data-echo-scroll-container
        className="relative flex-1 overflow-y-auto px-5 pb-[96px] pt-3 scroll-smooth"
        style={{
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px) + 12px)',
        }}
      >
        {messages.length === 0 && !isStreaming ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2 pb-20">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-white/90">Ask Echo anything</h3>
              <p className="text-sm text-white/60 max-w-xs">
                Get golf tips, course info, or just chat about the game
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <EchoMessageRow
                key={message.id}
                message={message}
                onContextMenu={openContextMenu}
              />
            ))}
            
            {isStreaming && <EchoTypingRow />}
            
            {/* Scroll anchor */}
            <div className="h-1" />
          </>
        )}
        
        {/* Bottom fade mask */}
        <div className="pointer-events-none fixed inset-x-0 bottom-[64px] h-10 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
      </div>

      {/* Jump to bottom button */}
      {showJumpToBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="fixed right-4 bottom-[76px] z-20 rounded-full px-3 py-1.5 
                     bg-black/60 border border-white/12 backdrop-blur-xl 
                     shadow-[0_10px_30px_rgba(0,0,0,0.6)]
                     text-[12px] font-medium text-white/90 flex items-center gap-1
                     active:scale-[0.96] transition-transform"
        >
          <span className="inline-block h-[18px] w-[18px] rounded-full border border-white/30 flex items-center justify-center text-[10px]">
            ⌄
          </span>
          New reply
        </button>
      )}

      {/* Input Bar */}
      <footer className="relative z-10 px-4 pt-2 pb-[10px]" style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl px-3 py-2",
            "bg-black/45 border border-white/14 shadow-[0_12px_30px_rgba(0,0,0,0.8)]",
            "backdrop-blur-xl"
          )}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Echo..."
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-white/92
                       placeholder:text-white/40"
            style={{ caretColor: 'var(--echo-accent)' }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
              "border border-white/18 bg-white/10 backdrop-blur-xl",
              "shadow-[0_8px_20px_rgba(0,0,0,0.65)]",
              "active:scale-[0.94] transition-transform",
              !input.trim() || isStreaming
                ? "opacity-40 cursor-default"
                : "opacity-100 hover:bg-white/16"
            )}
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </footer>

      {/* Context Menu */}
      {contextMenu && (
        <EchoContextMenu
          message={contextMenu.message}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
          onCopy={handleCopy}
          onReply={handleReply}
          onShare={handleShare}
        />
      )}
    </div>
  );
}
