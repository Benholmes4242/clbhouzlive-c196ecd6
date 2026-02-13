/**
 * EchoResponseCard - Left-aligned assistant bubble
 * Warm amber tint to differentiate Echo's voice
 */

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, ChevronRight, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/utils/haptics';
import { sanitizeEchoText, generateFollowUps, ECHO_ALLOWED_ELEMENTS } from '@/features/echo/utils/echoFormat';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

// Course linkification patterns
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
  const prefersReduced = usePrefersReducedMotion();
  const navigate = useNavigate();

  const cleanContent = sanitizeEchoText(content);
  const followUps = isLast && lastResponse ? generateFollowUps(lastResponse) : [];

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
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        {/* Main bubble - warm amber tint */}
        <div 
          className="px-4 py-2.5 rounded-[16px_16px_16px_4px] backdrop-blur-[16px]"
          style={{
            background: 'rgba(255,245,235,0.7)',
            border: '1px solid rgba(234,88,12,0.06)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          <div className="text-[14px] prose prose-sm prose-neutral max-w-none" style={{ color: '#1C1917', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
            <ReactMarkdown
              allowedElements={ECHO_ALLOWED_ELEMENTS}
              unwrapDisallowed
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-2" style={{ color: '#44403C' }}>{children}</ol>,
                li: ({ children }) => <li style={{ color: '#1C1917' }}>{children}</li>,
                strong: ({ children }) => <strong className="font-semibold" style={{ color: '#1C1917' }}>{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
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
                          className="text-[#B45309] font-medium underline decoration-[#FFBF66] underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity"
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
                  <code className="px-1 py-0.5 rounded bg-[#F0F0F5] text-[0.8125rem] font-mono text-[#1D1D1F]">
                    {children}
                  </code>
                ),
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
          
          {/* Streaming cursor - pulsing orange bar */}
          {isStreaming && (
            <span 
              className="inline-block w-[3px] h-4 rounded-full ml-1"
              style={{
                backgroundColor: '#EA580C',
                animation: prefersReduced ? 'none' : 'echoCursorBlink 1s ease-in-out infinite',
              }}
            />
          )}
          
          {/* Aborted indicator */}
          {wasAborted && (
            <span className="text-[0.75rem] mt-1 block" style={{ color: '#A8A29E' }}>(stopped)</span>
          )}
        </div>

        {/* Copy button */}
        {!isStreaming && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 mt-1.5 px-2 py-1 text-[12px] font-medium active:opacity-70 transition-all"
            style={{ color: copied ? '#EA580C' : '#A8A29E' }}
            aria-label="Copy response to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" style={{ color: '#EA580C' }} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}

        {/* Follow-up chips */}
        {isLast && !isStreaming && followUps.length > 0 && (
          <div className="flex flex-col gap-[6px] mt-2">
            {followUps.map((chip) => (
              <button
                key={chip}
                onClick={() => handleFollowUp(chip)}
                className="flex items-center justify-between gap-2 px-[14px] py-[9px] rounded-[12px] text-[13px] font-medium active:scale-[0.98] transition-transform backdrop-blur-[8px]"
                style={{
                  background: 'rgba(234,88,12,0.06)',
                  border: '1px solid rgba(234,88,12,0.12)',
                  color: '#EA580C',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                aria-label={`Ask: ${chip}`}
              >
                <span>{chip}</span>
                <ChevronRight className="w-[14px] h-[14px] flex-shrink-0" style={{ color: '#EA580C' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
