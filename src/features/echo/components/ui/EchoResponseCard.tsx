/**
 * EchoResponseCard - Left-aligned assistant bubble with waveform avatar (light dispatch theme)
 */

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, ChevronRight, Share2, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';
import { generateFollowUps, ECHO_ALLOWED_ELEMENTS } from '@/features/echo/utils/echoFormat';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';
import { analyticsEvents } from '@/utils/analyticsEvents';

const COURSE_PATTERNS = [
  /\b([A-Z][a-zA-Z\s''-]+(?:Golf Club|Golf Course|Golf Links|Country Club))\b/g,
];

function courseNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/golf club|golf course|golf links|country club/gi, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface EchoResponseCardProps {
  content: string;
  isStreaming?: boolean;
  isLast?: boolean;
  lastResponse?: string;
  onFollowUp: (text: string) => void;
  onRegenerate?: () => void;
  recentUserMessages?: string[];
  showAvatar?: boolean;
  wasAborted?: boolean;
}

export function EchoResponseCard({
  content,
  isStreaming,
  isLast,
  lastResponse,
  onFollowUp,
  onRegenerate,
  recentUserMessages = [],
  showAvatar = true,
  wasAborted,
}: EchoResponseCardProps) {
  const [copied, setCopied] = useState(false);
  const [thumbState, setThumbState] = useState<'up' | 'down' | null>(null);
  const prefersReduced = usePrefersReducedMotion();
  const navigate = useNavigate();

  const cleanContent = content;
  const followUps = isLast && lastResponse ? generateFollowUps(lastResponse, recentUserMessages) : [];

  const courseMatches = useMemo(() => {
    const matches: Set<string> = new Set();
    for (const pattern of COURSE_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(cleanContent)) !== null) {
        matches.add(match[1]);
      }
    }
    return Array.from(matches);
  }, [cleanContent]);

  const handleCourseClick = (courseName: string) => {
    haptic('light');
    navigate(`/courses?search=${encodeURIComponent(courseName)}`);
  };

  const handleCopy = async () => {
    haptic('light');
    analyticsEvents.track('echo_response_copied', { length: cleanContent.length });
    try {
      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    haptic('light');
    analyticsEvents.track('echo_response_shared', { length: cleanContent.length });
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Echo response',
          text: cleanContent,
        });
        return;
      } catch {
        // user cancelled or share unavailable — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(cleanContent);
      toast.success('Copied to share');
    } catch {
      toast.error('Could not share');
    }
  };

  const handleRegenerate = () => {
    haptic('medium');
    analyticsEvents.track('echo_response_regenerated', {});
    onRegenerate?.();
  };

  const handleThumb = (direction: 'up' | 'down') => {
    haptic('light');
    const next = thumbState === direction ? null : direction;
    setThumbState(next);
    if (next) {
      analyticsEvents.track('echo_response_rated', { rating: next });
      if (next === 'down') {
        toast("Thanks — we'll use this to improve Echo", { duration: 2000 });
      }
    }
  };

  const handleFollowUp = (text: string) => {
    haptic('light');
    onFollowUp(text);
  };

  const bubbleRadius = showAvatar ? '4px 18px 18px 18px' : '18px 18px 18px 4px';

  return (
    <div className="flex justify-start gap-2 items-start">
      {/* Waveform avatar — only on first assistant message in a group */}
      {showAvatar ? (
        <div
          className="flex-shrink-0 mt-1 flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #F7931E, #e07d0a)',
          }}
        >
          <AnimatedEchoWave size={14} active={true} />
        </div>
      ) : (
        <div className="flex-shrink-0" style={{ width: 28, height: 28 }} aria-hidden="true" />
      )}

      <div className="max-w-[88%]">
        {/* Main bubble — corner radius adapts to avatar presence */}
        <div
          className="px-4 py-4"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(15,23,42,0.07)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            borderRadius: bubbleRadius,
          }}
        >
          <div className="text-[14px] prose prose-sm max-w-none" style={{ lineHeight: 1.65, color: '#1e293b' }}>
            <ReactMarkdown
              allowedElements={ECHO_ALLOWED_ELEMENTS}
              unwrapDisallowed
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: '#1e293b' }}>{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1" style={{ color: '#1e293b' }}>{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-2" style={{ color: '#1e293b' }}>{children}</ol>,
                li: ({ children }) => <li style={{ color: '#1e293b' }}>{children}</li>,
                strong: ({ children }) => <strong className="font-semibold" style={{ color: '#0F172A' }}>{children}</strong>,
                em: ({ children }) => <em className="italic" style={{ color: '#334155' }}>{children}</em>,
                text: ({ children }) => {
                  if (typeof children !== 'string' || courseMatches.length === 0) {
                    return <>{children}</>;
                  }

                  let result: React.ReactNode[] = [];
                  let remainingText = children;
                  let keyIndex = 0;

                  for (const courseName of courseMatches) {
                    const index = remainingText.indexOf(courseName);
                    if (index !== -1) {
                      if (index > 0) {
                        result.push(remainingText.slice(0, index));
                      }
                      result.push(
                        <span
                          key={`course-${keyIndex++}`}
                          onClick={() => handleCourseClick(courseName)}
                          className="font-medium underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ color: '#F7931E', textDecorationColor: '#F7931E' }}
                          role="link"
                          tabIndex={0}
                          aria-label={`View ${courseName}`}
                          onKeyDown={(e) => e.key === 'Enter' && handleCourseClick(courseName)}
                        >
                          {courseName}
                        </span>
                      );
                      remainingText = remainingText.slice(index + courseName.length);
                    }
                  }

                  if (remainingText) {
                    result.push(remainingText);
                  }

                  return result.length > 0 ? <>{result}</> : <>{children}</>;
                },
                code: ({ children }) => (
                  <code
                    className="px-1.5 py-0.5 rounded-md text-[0.8125rem] font-mono"
                    style={{ background: 'rgba(15,23,42,0.06)', color: '#334155' }}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>

          {/* Streaming cursor */}
          {isStreaming && (
            <span
              className="inline-block w-[3px] h-4 rounded-full ml-1"
              style={{
                background: '#F7931E',
                animation: prefersReduced ? 'none' : 'echoCursorBlink 1s ease-in-out infinite',
              }}
            />
          )}

          {/* Aborted indicator */}
          {wasAborted && (
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4, display: 'block' }}>(stopped)</span>
          )}
        </div>

        {/* Action row */}
        {!isStreaming && (
          <div className="flex items-center gap-1 mt-2">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.97]"
              style={{ color: copied ? '#F7931E' : '#94A3B8' }}
              aria-label="Copy response to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" style={{ color: '#F7931E' }} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.97]"
              style={{ color: '#94A3B8' }}
              aria-label="Share response"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {/* Regenerate (only on last assistant message) */}
            {isLast && onRegenerate && (
              <button
                onClick={handleRegenerate}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.97]"
                style={{ color: '#94A3B8' }}
                aria-label="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}

            <div className="flex-1" />

            {/* Thumbs up */}
            <button
              onClick={() => handleThumb('up')}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-[0.97]"
              style={{
                background: thumbState === 'up' ? 'rgba(16,185,129,0.10)' : 'rgba(15,23,42,0.04)',
                border: thumbState === 'up' ? '0.5px solid rgba(16,185,129,0.30)' : '0.5px solid rgba(15,23,42,0.07)',
                color: thumbState === 'up' ? '#10B981' : '#94A3B8',
              }}
              aria-label="Mark response as helpful"
              aria-pressed={thumbState === 'up'}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            {/* Thumbs down */}
            <button
              onClick={() => handleThumb('down')}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-[0.97]"
              style={{
                background: thumbState === 'down' ? 'rgba(239,68,68,0.08)' : 'rgba(15,23,42,0.04)',
                border: thumbState === 'down' ? '0.5px solid rgba(239,68,68,0.25)' : '0.5px solid rgba(15,23,42,0.07)',
                color: thumbState === 'down' ? '#DC2626' : '#94A3B8',
              }}
              aria-label="Mark response as unhelpful"
              aria-pressed={thumbState === 'down'}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Follow-up chips — horizontal scroll, amber-tinted */}
        {isLast && !isStreaming && followUps.length > 0 && (
          <div
            className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          >
            {followUps.map((chip) => (
              <button
                key={chip}
                onClick={() => handleFollowUp(chip)}
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-medium active:scale-[0.97] transition-all whitespace-nowrap"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(247,147,30,0.20)',
                  color: '#F7931E',
                }}
                aria-label={`Ask: ${chip}`}
              >
                <span>{chip}</span>
                <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(247,147,30,0.6)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
