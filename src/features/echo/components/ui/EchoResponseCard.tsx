/**
 * EchoResponseCard - Left-aligned assistant bubble
 */

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/utils/haptics';
import { generateFollowUps, ECHO_ALLOWED_ELEMENTS } from '@/features/echo/utils/echoFormat';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

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

  const cleanContent = content;
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
      <div className="max-w-[92%]">
        {/* Main bubble */}
        <div
          className="px-4 py-4 rounded-[4px_18px_18px_18px] bg-background border"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div className="text-[14px] prose prose-sm max-w-none text-foreground" style={{ lineHeight: 1.65 }}>
            <ReactMarkdown
              allowedElements={ECHO_ALLOWED_ELEMENTS}
              unwrapDisallowed
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-foreground">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-2 text-foreground">{children}</ol>,
                li: ({ children }) => <li className="text-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
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
                          className="text-[hsl(35,80%,43%)] font-medium underline decoration-[hsl(35,80%,43%)] underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity"
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
                  <code className="px-1.5 py-0.5 rounded-md bg-muted text-[0.8125rem] font-mono text-foreground">
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
              className="inline-block w-[3px] h-4 rounded-full ml-1 bg-[hsl(38,92%,50%)]"
              style={{
                animation: prefersReduced ? 'none' : 'echoCursorBlink 1s ease-in-out infinite',
              }}
            />
          )}
          
          {/* Aborted indicator */}
          {wasAborted && (
            <span className="text-[0.75rem] text-muted-foreground mt-1 block">(stopped)</span>
          )}
        </div>

        {/* Copy button */}
        {!isStreaming && (
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg text-[12px] font-medium active:bg-[hsl(38,92%,50%)]/5 transition-all ${copied ? 'text-[hsl(35,80%,43%)]' : 'text-muted-foreground'}`}
            aria-label="Copy response to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[hsl(35,80%,43%)]" />
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
          <div className="flex flex-col gap-2 mt-3">
            {followUps.map((chip) => (
              <button
                key={chip}
                onClick={() => handleFollowUp(chip)}
                className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-[13px] font-medium active:bg-[hsl(38,92%,50%)]/5 active:scale-[0.98] transition-all duration-150 bg-background border border-border text-foreground"
                aria-label={`Ask: ${chip}`}
              >
                <span>{chip}</span>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
