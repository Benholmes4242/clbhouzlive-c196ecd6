import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, MoreHorizontal, User, Bot, Globe, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SwingReview } from '@/components/swing-review/SwingReview';
import { CoachPrompt } from '@/components/swing-review/CoachPrompt';
import { parseSwingAnalysis } from '@/utils/swingAnalysisParser';
import { cn } from '@/lib/utils';
import { EchoBotIcon } from './EchoBotIcon';
import SquircleImage from '@/components/ui/SquircleImage';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    save_card?: string;
    tags?: string[];
    category?: string;
    videoUrl?: string;
    modeUsed?: 'live' | 'static';
    sources?: string;
    provider?: string;
    asOf?: string;
    latencyMs?: number;
  };
}

interface ChatMessageProps {
  message: ChatMessage;
  onSaveToInsights?: (message: ChatMessage) => void;
  onRequestDetail?: (content: string) => void;
  onAskEcho?: (prompt: string) => void;
  onShare?: (message: ChatMessage) => void;
  onAddVoiceNote?: (message: ChatMessage) => void;
  isFirstInGroup?: boolean;
  showHeading?: boolean;
  showActions?: boolean;         // Control action pills visibility
  isUser?: boolean;              // Override user detection
  mediaTop?: React.ReactNode;    // Optional media at the top of the bubble
  children?: React.ReactNode;    // Override default content rendering
  userProfilePhoto?: string | null;  // User's profile photo URL
  userDisplayName?: string;      // User's display name for fallback
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onSaveToInsights, 
  onRequestDetail,
  onAskEcho,
  onShare,
  onAddVoiceNote,
  isFirstInGroup = true,
  showHeading = true,
  showActions = true,
  isUser: isUserProp,
  mediaTop,
  children,
  userProfilePhoto,
  userDisplayName,
}) => {
  const isUser = isUserProp ?? message.type === 'user';
  const [showSources, setShowSources] = useState(false);
  
  // Use metadata flag for save action instead of brittle string includes
  const isSwingCoachMessage = message.metadata?.category === 'swing_analysis';
  const showSaveOption = !!message.metadata?.save_card && !isSwingCoachMessage;
  const showDetailOption = !isUser && !message.content.includes('Explain fully') && !isSwingCoachMessage;

  // Normalize timestamp safely
  const safeDate = new Date(typeof message.timestamp === 'string' ? message.timestamp : message.timestamp);
  const time = isNaN(safeDate.getTime()) ? '' : safeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Check if this is a swing analysis message and try to parse it
  const isSwingAnalysis = !isUser && message.metadata?.category === 'swing_analysis' && message.metadata?.videoUrl;
  let swingAnalysisData = null;
  
  if (isSwingAnalysis && message.metadata?.videoUrl) {
    swingAnalysisData = parseSwingAnalysis(message.content, message.metadata.videoUrl);
  }

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
          
        {/* Message content - Phase 50 actions & meta */}
        <div 
          className={cn(
            "relative group/message flex-1",
            isUser && "ml-auto"
          )}
          data-message-id={message.id}
          data-author={isUser ? "user" : "echo"}
          data-has-menu="true"
          data-state="ok"
          data-active="false"
          tabIndex={0}
        >
          {/* Action pills removed */}

          {/* Heading - only on first in group */}
          {!isUser && showHeading && isFirstInGroup && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[12px] font-medium text-white/70" style={{ letterSpacing: '0.2px' }}>
                Echo
              </span>
              <div 
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 28,
                  height: 28,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <Bot className="w-5 h-5 text-white/80" />
              </div>
            </div>
          )}
          {isUser && showHeading && isFirstInGroup && (
            <div className="mb-2 flex items-center justify-end gap-2">
              <span className="text-[12px] font-medium text-white/70" style={{ letterSpacing: '0.2px' }}>
                User
              </span>
              {userProfilePhoto ? (
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
              )}
            </div>
          )}
          
          {/* Bubble */}
          <div 
            role="group"
            aria-label={`Message from ${isUser ? 'You' : 'Echo'} at ${time}`}
            className={cn(
              "text-[15px] relative overflow-hidden backdrop-blur-[var(--glass-blur)] echo-bubble",
              isUser 
                ? "ml-auto rounded-2xl text-white/95 leading-[1.5]" 
                : "rounded-2xl rounded-bl-md text-white/90 leading-[1.55]"
            )}
            style={
              isUser ? {
                maxWidth: '84vw',
                background: 'var(--bubble-user-bg)',
                border: '1px solid rgba(255,255,255,0.20)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 0 28px rgba(255,255,255,0.14)',
              } : {
                maxWidth: '84vw',
                background: 'linear-gradient(145deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.06) 100%)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15), var(--bubble-echo-inset)',
              }
            }
          >
            {/* Edge-to-edge media at top if provided */}
            {mediaTop}
            
            {/* Content wrapper - only add padding if there's actual content */}
            {children ? (
              <div style={{ padding: 'var(--bubble-pad-y) var(--bubble-pad-x)' }}>{children}</div>
            ) : (
              <div style={{ padding: 'var(--bubble-pad-y) var(--bubble-pad-x)' }}>
                {isUser ? (
                  <div className="break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{message.content}</div>
                ) : swingAnalysisData ? (
                <div className="mt-2 rounded-2xl overflow-hidden bg-white/06 backdrop-blur border border-white/08 shadow-[0_10px_30px_rgba(0,0,0,0.4)]" data-swing-card>
                  <SwingReview
                    videoUrl={message.metadata!.videoUrl!}
                    summary={swingAnalysisData.summary}
                    phases={swingAnalysisData.phases}
                    priorityFix={swingAnalysisData.priorityFix}
                    drills={swingAnalysisData.drills}
                    onShare={() => onShare?.(message)}
                    onAddVoiceNote={() => onAddVoiceNote?.(message)}
                  />
                  <div className="p-3 sm:p-4">
                    <CoachPrompt
                      swingAnalysisId={message.id}
                      onOpen={() => {
                        console.log('Open coach finder for analysis:', message.id);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: (props) => (
                        <a 
                          {...props} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="underline decoration-white/50 underline-offset-2 hover:decoration-white text-white/85 break-words focus:outline-none focus:ring-[8px] focus:ring-white/[0.08] rounded"
                        />
                      ),
                      h1: ({ children }) => <h3 className="text-[16px] font-semibold mb-2 mt-[10px] first:mt-0 text-white" style={{ letterSpacing: '0.2px' }}>{children}</h3>,
                      h2: ({ children }) => <h4 className="text-[15.5px] font-semibold mb-2 mt-[10px] text-white" style={{ letterSpacing: '0.2px' }}>{children}</h4>,
                      h3: ({ children }) => <h4 className="text-[15px] font-semibold mb-[6px] mt-[10px] text-white" style={{ fontWeight: 600, letterSpacing: '0.2px' }}>{children}</h4>,
                      p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 break-words">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-[18px] my-2 marker:text-white/65">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-[18px] my-2 marker:text-white/65">{children}</ol>,
                      li: ({ children }) => <li className="leading-[1.55] my-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      code: ({ inline, children, ...props }: any) => 
                        inline ? (
                          <code className="px-1.5 py-0.5 rounded-[4px] bg-white/08 border border-white/12 text-[13px] font-mono text-white" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="font-mono text-[13px] text-gray-100" {...props}>{children}</code>
                        ),
                      pre: ({ children }) => (
                        <div 
                          role="region" 
                          aria-label="Code snippet"
                          className="mt-2 overflow-x-auto rounded-[10px] bg-black/70 text-white border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,1)]"
                        >
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                            <span className="text-[11px] text-white/60 font-medium">Code</span>
                            <button
                              aria-label="Copy code"
                              className="text-[11px] text-white/60 hover:text-white/90 px-2 py-0.5 rounded hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="p-3 text-[13px] leading-[1.5]">
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
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              </div>
            )}
            
            {/* Tags from metadata (wrapped with proper padding) */}
            {!children && (
              <div style={{ paddingLeft: 'var(--bubble-pad-x)', paddingRight: 'var(--bubble-pad-x)', paddingBottom: 'var(--bubble-pad-y)' }}>
                {message.metadata?.tags && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.metadata.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/08 backdrop-blur border border-white/12 rounded-full text-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mode badge and sources for AI messages */}
                {!isUser && message.metadata?.modeUsed && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs h-5 px-2 backdrop-blur-md border-0 ${
                    message.metadata.modeUsed === 'live' 
                      ? 'bg-green-900/20 text-green-300' 
                      : 'bg-blue-900/20 text-blue-300'
                  }`}
                >
                  {message.metadata.modeUsed === 'live' ? (
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
                
                {message.metadata.asOf && message.metadata.modeUsed === 'live' && (
                  <span className="text-[12px] text-white/55">
                    As of {message.metadata.asOf}
                  </span>
                )}
                
                {message.metadata.sources && (
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
                {!isUser && showSources && message.metadata?.sources && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                    <div className="font-medium mb-1">Sources used:</div>
                    <div>Live search results from web sources</div>
                  </div>
                )}
                
                {/* Action buttons removed */}
              </div>
            )}
          </div>
          
          {/* Quick reactions strip (inline) - Phase 42 */}
          {false && ( /* Set data-reacting="true" to show */
            <div className="mt-1 flex flex-wrap gap-1.5 data-[reacting=true]:flex hidden" data-reacting="false">
              <button className="h-8 px-2.5 rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm text-[13px] hover:bg-white active:scale-95 transition" type="button">👍</button>
              <button className="h-8 px-2.5 rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm text-[13px] hover:bg-white active:scale-95 transition" type="button">👏</button>
              <button className="h-8 px-2.5 rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm text-[13px] hover:bg-white active:scale-95 transition" type="button">❤️</button>
              <button className="h-8 px-2.5 rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm text-[13px] hover:bg-white active:scale-95 transition" type="button">🤯</button>
            </div>
          )}
          
          {/* Failed state banner - Phase 42 */}
          {false && ( /* Set to true to show failed state */
            <div className="mt-2 flex items-center gap-2 text-[12px] text-amber-700">
              <span className="h-5 w-5 grid place-items-center rounded-full bg-amber-50 border border-amber-200">!</span>
              <span className="flex-1">Delivery failed. Tap to retry.</span>
              <button className="h-8 px-3 rounded-full bg-white border border-black/10 shadow-sm hover:bg-gray-50 text-[12px] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40" type="button">
                Retry
              </button>
            </div>
          )}
          
          {/* Inline meta row - Phase 50 (timestamp + status) */}
          <div className={cn(
            "pt-1 text-[12px] text-white/55 select-none",
            isUser ? "text-right pr-2" : "pl-2"
          )}>
            {time && (
              <span style={{ letterSpacing: '0.2px' }}>
                {time}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;