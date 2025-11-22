/**
 * MessageBubble - Unified message rendering component
 * Single source of truth for all Echo message display (live chat & history)
 * Apple-grade styling with markdown support
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Globe, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SquircleImage from '@/components/ui/SquircleImage';
import EchoAvatar from './EchoAvatar';
import { HighlightedText } from '@/features/echo/components/HighlightedText';

export interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string | Date;
  firstInGroup?: boolean;
  lastInGroup?: boolean;
  readOnly?: boolean;
  showChips?: boolean;
  maxWidth?: 'mobile' | 'desktop';
  metadata?: {
    modeUsed?: 'live' | 'static';
    sources?: string;
    asOf?: string;
  };
  userProfilePhoto?: string | null;
  userDisplayName?: string;
  mediaTop?: React.ReactNode;
  children?: React.ReactNode;
  searchQuery?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  timestamp,
  firstInGroup = true,
  lastInGroup = true,
  readOnly = false,
  showChips = true,
  maxWidth = 'mobile',
  metadata,
  userProfilePhoto,
  userDisplayName,
  mediaTop,
  children,
  searchQuery,
}) => {
  const [showSources, setShowSources] = useState(false);
  const isUser = role === 'user';

  // Format timestamp
  const safeDate = timestamp ? new Date(typeof timestamp === 'string' ? timestamp : timestamp) : null;
  const time = safeDate && !isNaN(safeDate.getTime()) 
    ? safeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div 
      role="article"
      aria-label={`Message from ${isUser ? 'You' : 'Echo'}, ${time}`}
      className="animate-[fadeInUp_.18s_ease-out_both]"
    >
      <div className={cn(
        "flex items-end gap-2.5",
        isUser && "flex-row-reverse justify-end"
      )}>
        {/* Message content */}
        <div 
          className={cn(
            "relative group/message flex-1",
            isUser && "ml-auto"
          )}
        >
          {/* Avatar chip - only on first in group */}
          {showChips && firstInGroup && (
            <div className={cn(
              "mb-2 flex items-center gap-2",
              isUser && "justify-end"
            )}>
              <span 
                className="text-[12px] font-medium text-white/70" 
                style={{ letterSpacing: '0.2px' }}
              >
                {isUser ? 'You' : 'Echo'}
              </span>
              {isUser ? (
                userProfilePhoto ? (
                  <SquircleImage
                    size={28}
                    src={userProfilePhoto}
                    alt={userDisplayName || 'User'}
                    ringColor="rgba(255,255,255,0.2)"
                    ringWidth={1}
                  />
                ) : (
                  <div 
                    className="flex items-center justify-center text-[11px] font-medium text-white/90"
                    style={{
                      width: 28,
                      height: 28,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  >
                    {userDisplayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )
              ) : (
                <EchoAvatar state="idle" size={28} />
              )}
            </div>
          )}

          {/* Bubble */}
          <div 
            role="group"
            aria-label={`Message from ${isUser ? 'You' : 'Echo'} at ${time}`}
            className={cn(
              "text-body-md relative overflow-hidden backdrop-blur-[var(--glass-blur)] bubble-prose",
              isUser 
                ? "ml-auto text-white/95 leading-relaxed font-normal" 
                : "text-white/90 leading-relaxed font-normal"
            )}
            style={{
              borderRadius: 'var(--bubble-radius)',
              maxWidth: maxWidth === 'mobile' ? 'var(--bubble-max-mobile)' : 'var(--bubble-max-desktop)',
              background: isUser ? 'var(--bubble-user-bg)' : 'var(--bubble-echo-grad)',
              border: isUser ? '1px solid var(--bubble-user-border)' : '1px solid var(--bubble-echo-border)',
              boxShadow: isUser 
                ? '0 2px 8px rgba(0,0,0,0.15), var(--bubble-user-inset)'
                : '0 2px 8px rgba(0,0,0,0.15), var(--bubble-echo-inset)',
            }}
          >
            {/* Edge-to-edge media at top if provided */}
            {mediaTop}

            {/* Content wrapper */}
            {children ? (
              <div style={{ padding: 'var(--bubble-pad-y) var(--bubble-pad-x)' }}>{children}</div>
            ) : (
              <div style={{ padding: 'var(--bubble-pad-y) var(--bubble-pad-x)' }}>
                {isUser ? (
                  <div 
                    className="break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    <HighlightedText
                      text={content}
                      query={searchQuery}
                      announceCount={!!searchQuery}
                    />
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: (props) => (
                        <a 
                          {...props} 
                          target={readOnly ? "_blank" : undefined}
                          rel={readOnly ? "noopener noreferrer" : undefined}
                          className="underline decoration-white/50 underline-offset-2 hover:decoration-white text-white/85 break-words focus:outline-none focus:ring-[8px] focus:ring-white/[0.08] rounded"
                        />
                      ),
                      h1: ({ children }) => (
                        <h3 className="text-body-md font-semibold mb-2 mt-[10px] first:mt-0 text-white">
                          {children}
                        </h3>
                      ),
                      h2: ({ children }) => (
                        <h4 className="text-body-md font-semibold mb-2 mt-[10px] text-white">
                          {children}
                        </h4>
                      ),
                      h3: ({ children }) => (
                        <h4 className="text-body-md font-semibold mb-[6px] mt-[10px] text-white">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => (
                        <p className="my-2 first:mt-0 last:mb-0 break-words">
                          {searchQuery && typeof children === 'string' ? (
                            <HighlightedText
                              text={children}
                              query={searchQuery}
                              announceCount={false}
                            />
                          ) : (
                            children
                          )}
                        </p>
                      ),
                      ul: ({ children }) => <ul className="list-disc pl-[18px] my-2 marker:text-white/65">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-[18px] my-2 marker:text-white/65">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed my-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      code: ({ inline, children, ...props }: any) => 
                        inline ? (
                          <code className="px-1.5 py-0.5 rounded-[4px] bg-white/08 border border-white/12 text-body-sm font-mono text-white" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="font-mono text-body-sm text-gray-100" {...props}>{children}</code>
                        ),
                      pre: ({ children }) => (
                        <div 
                          role="region" 
                          aria-label="Code snippet"
                          className="mt-2 overflow-x-auto rounded-[10px] bg-black/70 text-white border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,1)]"
                        >
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                            <span className="text-meta text-white/60 font-medium">Code</span>
                          </div>
                          <pre className="p-3 text-body-sm leading-relaxed">
                            {children}
                          </pre>
                        </div>
                      ),
                      img: (props) => (
                        <div className="mt-3 overflow-hidden rounded-xl border border-white/08 bg-white/06 backdrop-blur shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                          <img {...props} className="block w-full h-auto" />
                        </div>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                )}

                {/* Mode badge and sources for AI messages */}
                {!isUser && metadata?.modeUsed && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs h-5 px-2 backdrop-blur-md border-0 ${
                        metadata.modeUsed === 'live' 
                          ? 'bg-green-900/20 text-green-300' 
                          : 'bg-blue-900/20 text-blue-300'
                      }`}
                    >
                      {metadata.modeUsed === 'live' ? (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Web-sourced
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          Model-only
                        </>
                      )}
                    </Badge>
                    
                    {metadata.asOf && metadata.modeUsed === 'live' && (
                      <span className="text-[12px] text-white/55">
                        As of {metadata.asOf}
                      </span>
                    )}
                    
                    {metadata.sources && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSources(!showSources)}
                        className="text-xs h-5 px-2 text-muted-foreground hover:text-foreground"
                      >
                        Sources
                        {showSources ? 
                          <ChevronUp className="h-3 w-3 ml-1" /> : 
                          <ChevronDown className="h-3 w-3 ml-1" />
                        }
                      </Button>
                    )}
                  </div>
                )}

                {/* Expandable sources section */}
                {!isUser && showSources && metadata?.sources && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                    <div className="font-medium mb-1">Sources used:</div>
                    <div>Live search results from web sources</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp - only on last in group */}
          {lastInGroup && time && (
            <div className={cn(
              "pt-1 text-[11px] text-white/55 select-none",
              isUser ? "text-right pr-2" : "pl-2"
            )}>
              <span style={{ letterSpacing: '0.2px' }}>{time}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
