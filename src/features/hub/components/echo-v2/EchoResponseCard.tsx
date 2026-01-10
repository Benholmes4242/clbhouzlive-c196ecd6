/**
 * EchoResponseCard - Premium glass card for assistant responses
 * Includes action buttons and follow-up chips
 */

import React, { useState } from 'react';
import { Sparkles, Copy, Check, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { sanitizeEchoText, generateFollowUps } from '@/features/echo/utils/echoFormat';

interface EchoResponseCardProps {
  content: string;
  isStreaming?: boolean;
  isLast?: boolean;
  lastResponse?: string;
  onFollowUp: (text: string) => void;
}

export function EchoResponseCard({
  content,
  isStreaming,
  isLast,
  lastResponse,
  onFollowUp,
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
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
      </div>

      {/* Response card */}
      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-md overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* Header row */}
          <div 
            className="flex items-center gap-2 px-3.5 pt-2.5 pb-1"
            style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.03)' }}
          >
            <span 
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: '#a855f7' }}
            >
              Echo
            </span>
            {isStreaming && (
              <span className="inline-block w-1.5 h-3 bg-purple-500 opacity-70 animate-pulse rounded-sm" />
            )}
          </div>

          {/* Content */}
          <div 
            className="px-3.5 py-2.5 text-[14px] leading-[1.6]"
            style={{ color: '#1e293b' }}
          >
            <div className="whitespace-pre-wrap">{cleanContent}</div>
          </div>

          {/* Actions row - only show when not streaming */}
          {!isStreaming && (
            <div 
              className="flex items-center gap-2 px-3 pb-2.5"
              style={{ borderTop: '1px solid rgba(0, 0, 0, 0.03)' }}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95"
                style={{
                  background: 'rgba(0, 0, 0, 0.03)',
                  color: '#64748b',
                }}
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
                  background: 'rgba(168, 85, 247, 0.06)',
                  border: '1px solid rgba(168, 85, 247, 0.12)',
                  color: '#7c3aed',
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
