/**
 * EchoResponseCard - Premium glass card for assistant responses
 * Uses design tokens and proper markdown rendering
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Copy, Check, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { sanitizeEchoText, generateFollowUps, ECHO_ALLOWED_ELEMENTS } from '@/features/echo/utils/echoFormat';
import { cn } from '@/lib/utils';

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
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--echo-accent, 270 60% 60%) / 0.12) 0%, hsl(var(--echo-accent-dark, 262 83% 58%) / 0.08) 100%)',
          border: '1px solid hsl(var(--echo-accent, 270 60% 60%) / 0.15)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--echo-accent,270_60%_60%))]" />
      </div>

      {/* Response card */}
      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-md overflow-hidden bg-card/75 backdrop-blur-xl border border-border/30"
          style={{
            boxShadow: '0 2px 12px hsl(var(--foreground) / 0.04), 0 1px 3px hsl(var(--foreground) / 0.02)',
          }}
        >
          {/* Header row */}
          <div 
            className="flex items-center gap-2 px-3.5 pt-2.5 pb-1 border-b border-border/20"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--echo-accent,270_60%_60%))]">
              Echo
            </span>
            {isStreaming && (
              <span className="inline-block w-1.5 h-3 bg-[hsl(var(--echo-accent,270_60%_60%))] opacity-70 animate-pulse rounded-sm" />
            )}
            {wasAborted && (
              <span className="text-[10px] text-muted-foreground">(stopped)</span>
            )}
          </div>

          {/* Content - rendered as markdown */}
          <div className="px-3.5 py-2.5 text-[14px] leading-[1.6] text-foreground">
            <ReactMarkdown
              allowedElements={ECHO_ALLOWED_ELEMENTS}
              unwrapDisallowed
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>

          {/* Actions row - only show when not streaming */}
          {!isStreaming && (
            <div className="flex items-center gap-2 px-3 pb-2.5 border-t border-border/20">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95 bg-muted/50 text-muted-foreground hover:bg-muted"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Follow-up chips - only show on last message when not streaming */}
        {isLast && !isStreaming && followUps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {followUps.map((chip) => (
              <button
                key={chip}
                onClick={() => handleFollowUp(chip)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all active:scale-95"
                style={{
                  background: 'hsl(var(--echo-accent, 270 60% 60%) / 0.06)',
                  border: '1px solid hsl(var(--echo-accent, 270 60% 60%) / 0.12)',
                  color: 'hsl(var(--echo-accent-dark, 262 83% 58%))',
                }}
              >
                {chip}
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
