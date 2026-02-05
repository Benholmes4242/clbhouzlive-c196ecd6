 /**
  * EchoResponseCard - WhatsApp-style left-aligned assistant bubble
  * White background with tail on bottom-left
  */
 
 import React, { useState } from 'react';
 import ReactMarkdown from 'react-markdown';
 import { Copy, Check, ChevronRight } from 'lucide-react';
 import { haptic } from '@/utils/haptics';
 import { sanitizeEchoText, generateFollowUps, ECHO_ALLOWED_ELEMENTS } from '@/features/echo/utils/echoFormat';
 import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

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
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        {/* Main bubble */}
        <div className="px-4 py-2.5 bg-white rounded-[18px] rounded-bl-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          {/* Content - rendered as markdown */}
           <div className="text-[0.9375rem] text-[#1D1D1F] leading-relaxed prose prose-sm prose-neutral max-w-none">
            <ReactMarkdown
              allowedElements={ECHO_ALLOWED_ELEMENTS}
              unwrapDisallowed
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-[#1D1D1F]">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-[#1D1D1F]">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
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
          
          {/* Streaming indicator */}
          {isStreaming && (
             <span 
               className={`inline-block w-1.5 h-4 bg-[#FFBF66] rounded-full ml-1 ${prefersReduced ? '' : 'animate-pulse'}`} 
             />
          )}
          
          {/* Aborted indicator */}
          {wasAborted && (
             <span className="text-[0.75rem] text-[#8E8E93] mt-1 block">(stopped)</span>
          )}
        </div>

        {/* Copy button - only show when not streaming */}
        {!isStreaming && (
          <button
            onClick={handleCopy}
             className="flex items-center gap-1 mt-1.5 px-2 py-1 text-[0.75rem] text-[#8E8E93] active:opacity-70 transition-opacity"
             aria-label="Copy response to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}

        {/* Follow-up chips - only show on last message when not streaming */}
        {isLast && !isStreaming && followUps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {followUps.map((chip) => (
              <button
                key={chip}
                onClick={() => handleFollowUp(chip)}
                 className="flex items-center gap-1 px-3 py-1.5 bg-[#FFF4E6] rounded-full text-[0.75rem] font-medium text-[#B45309] active:opacity-70 transition-opacity"
                 aria-label={`Ask: ${chip}`}
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
