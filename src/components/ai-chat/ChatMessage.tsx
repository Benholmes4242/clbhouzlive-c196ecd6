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
  onSaveToInsights: (message: ChatMessage) => void;
  onRequestDetail: (content: string) => void;
  onAskEcho?: (prompt: string) => void;
  onShare?: (message: ChatMessage) => void;
  onAddVoiceNote?: (message: ChatMessage) => void;
  isFirstInGroup?: boolean;
  showHeading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onSaveToInsights, 
  onRequestDetail,
  onAskEcho,
  onShare,
  onAddVoiceNote,
  isFirstInGroup = true,
  showHeading = true
}) => {
  const isUser = message.type === 'user';
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
        "flex items-end gap-2",
        isUser ? "flex-row-reverse justify-end" : "justify-start"
      )}>
        {/* Avatar - only show for AI on first message in group */}
        {!isUser && isFirstInGroup && (
          <div className="shrink-0 h-7 w-7 rounded-full grid place-items-center bg-white/80 backdrop-blur border border-black/10">
            <Bot className="h-[14px] w-[14px] text-[#2A9D8F]" />
          </div>
        )}
        
        {/* Spacer for grouped messages */}
        {!isUser && !isFirstInGroup && (
          <div className="hidden sm:block w-7 shrink-0" />
        )}
        
        {/* Message content */}
        <div className={cn(
          "max-w-[78%]"
        )}>
          {/* Heading - only on first in group for AI */}
          {!isUser && showHeading && isFirstInGroup && (
            <div className="mb-1.5 ml-1 text-[11px] font-medium text-gray-600">
              Echo
            </div>
          )}
          
          {/* Bubble */}
          <div 
            role="group"
            aria-label={`Message from ${isUser ? 'You' : 'Echo'} at ${time}`}
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-[15px] break-words",
              isUser 
                ? "rounded-br-md bg-[#2A9D8F]/10 border border-[#2A9D8F]/25 text-gray-900 shadow-[0_6px_18px_rgba(42,157,143,0.15)]" 
                : "rounded-bl-md bg-white/92 backdrop-blur border border-black/10 text-gray-900 shadow-[0_10px_28px_rgba(0,0,0,0.08)]",
              isUser ? "leading-[1.5]" : "leading-[1.55]"
            )}
          >
            <div className="first:mt-0 last:mb-0">
              {isUser ? (
                <div className="break-words break-all">{message.content}</div>
              ) : swingAnalysisData ? (
                <div className="mt-2 rounded-2xl overflow-hidden bg-white/92 backdrop-blur border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]" data-swing-card>
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
                          className="underline decoration-[#2A9D8F]/50 underline-offset-2 hover:decoration-[#2A9D8F] text-[#2A9D8F] break-words focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/40 rounded"
                        />
                      ),
                      h1: ({ children }) => <h3 className="text-[16px] font-semibold mb-2 mt-3 first:mt-0 text-gray-900">{children}</h3>,
                      h2: ({ children }) => <h4 className="text-[15.5px] font-semibold mb-2 mt-3 text-gray-900">{children}</h4>,
                      h3: ({ children }) => <h4 className="text-[15px] font-semibold mb-2 mt-2 text-gray-900">{children}</h4>,
                      p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 break-words break-all">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 my-2 marker:text-gray-500">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 my-2 marker:text-gray-500">{children}</ol>,
                      li: ({ children }) => <li className="leading-[1.5]">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      code: ({ inline, children, ...props }: any) => 
                        inline ? (
                          <code className="px-1.5 py-0.5 rounded bg-black/5 border border-black/10 text-[13px] font-mono" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="font-mono text-[13px] text-gray-100" {...props}>{children}</code>
                        ),
                      pre: ({ children }) => (
                        <div 
                          role="region" 
                          aria-label="Code snippet"
                          className="mt-2 overflow-x-auto rounded-xl bg-gray-900 text-gray-100 border border-black/20 shadow-inner"
                        >
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                            <span className="text-[11px] text-white/60 font-medium">Code</span>
                            <button
                              aria-label="Copy code"
                              className="text-[11px] text-white/60 hover:text-white/90 px-2 py-0.5 rounded hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
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
                        <div className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-white/80 backdrop-blur shadow-sm">
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
            
            {/* Tags from metadata */}
            {message.metadata?.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {message.metadata.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/80 backdrop-blur border border-black/5 rounded-full">
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
                  className={`text-xs h-5 px-2 ${
                    message.metadata.modeUsed === 'live' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
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
                  <span className="text-xs text-muted-foreground">
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
            
            {/* Action buttons for AI messages (only show for non-swing analysis) */}
            {!isUser && !swingAnalysisData && showSaveOption && message.metadata && (
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => onSaveToInsights(message)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 min-h-[28px]"
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  Save to Insights
                </Button>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <div className={cn(
            "pt-1 text-[11px] text-gray-500 select-none",
            isUser ? "text-right" : ""
          )}>
            {time}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;