/**
 * EchoResponseCard - Premium glass card for assistant responses
 * Supports streaming with cursor animation
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { sanitizeEchoText, generateFollowUps, ECHO_ALLOWED_ELEMENTS } from '@/features/echo/utils/echoFormat';
import { cn } from '@/lib/utils';
import { HUB_CARD, ECHO_ORANGE, ECHO_ORANGE_DARK } from './echoStyles';

interface EchoResponseCardProps {
  content: string;
  isStreaming?: boolean;
  isLast?: boolean;
  lastResponse?: string;
  onFollowUp: (text: string) => void;
  wasAborted?: boolean;
}

export function EchoResponseCard({
  content,
  isStreaming,
  isLast,
  lastResponse,
  onFollowUp,
  wasAborted,
}: EchoResponseCardProps) {
  const [copied, setCopied] = useState(false);
  
  const cleanContent = sanitizeEchoText(content);
  const followUps = isLast && lastResponse ? generateFollowUps(lastResponse) : [];

  const handleCopy = async () => {
    haptic('light');
    try {
      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFollowUp = (text: string) => {
    haptic('light');
    onFollowUp(text);
  };

  return (
    <div className="flex gap-2.5">
      {/* Echo avatar */}
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ 
          background: `linear-gradient(145deg, ${ECHO_ORANGE}20 0%, ${ECHO_ORANGE}10 100%)`,
          border: `1.5px solid ${ECHO_ORANGE}28`,
        }}
      >
        <Sparkles className="w-4 h-4" style={{ color: ECHO_ORANGE }} />
      </div>

      {/* Response card */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "rounded-2xl rounded-tl-md overflow-hidden",
            HUB_CARD
          )}
        >
          {/* Header row */}
          <div 
            className="flex items-center gap-2 px-4 pt-3 pb-1.5 border-b border-black/[0.04]"
          >
            <span 
              className="text-[11px] font-semibold uppercase tracking-wider" 
              style={{ color: ECHO_ORANGE }}
            >
              Echo
            </span>
            
            {/* Streaming cursor */}
            {isStreaming && (
              <motion.span 
                className="inline-block w-1.5 h-4 rounded-sm"
                style={{ background: ECHO_ORANGE }}
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            
            {wasAborted && (
              <span className="text-[10px] text-slate-400 font-medium">(stopped)</span>
            )}
          </div>

          {/* Content - rendered as markdown */}
          <div className="px-4 py-3 text-[14px] leading-[1.65] text-slate-800">
            <ReactMarkdown
              allowedElements={ECHO_ALLOWED_ELEMENTS}
              unwrapDisallowed
              components={{
                p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1.5">{children}</ol>,
                li: ({ children }) => <li className="text-slate-800">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[13px] font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {cleanContent}
            </ReactMarkdown>
            
            {/* Streaming cursor at end of content */}
            {isStreaming && (
              <motion.span 
                className="inline-block w-0.5 h-4 ml-0.5 rounded-sm align-middle"
                style={{ background: ECHO_ORANGE }}
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>

          {/* Actions row - only show when not streaming */}
          {!isStreaming && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-black/[0.04] bg-slate-50/50">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 active:scale-95 bg-white border border-black/6 text-slate-600 hover:bg-slate-50 hover:text-slate-700 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Follow-up chips - only show on last message when not streaming */}
        {isLast && !isStreaming && followUps.length > 0 && (
          <motion.div 
            className="flex flex-wrap gap-2 mt-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
          >
            {followUps.map((chip, index) => (
              <motion.button
                key={chip}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
                onClick={() => handleFollowUp(chip)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 active:scale-[0.97] hover:shadow-md"
                style={{
                  background: `${ECHO_ORANGE}10`,
                  border: `1px solid ${ECHO_ORANGE}20`,
                  color: ECHO_ORANGE_DARK,
                }}
              >
                {chip}
                <ChevronRight className="w-3 h-3 opacity-60" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
