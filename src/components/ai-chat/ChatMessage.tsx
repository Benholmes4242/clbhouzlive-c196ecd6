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
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onSaveToInsights, 
  onRequestDetail,
  onAskEcho,
  onShare,
  onAddVoiceNote
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
    <div className="flex flex-col" data-echo-group>
      <div className={cn(
        "group relative flex gap-[var(--bubble-gap-x)]",
        isUser ? "flex-row-reverse self-end" : "self-start"
      )} data-echo-msg={isUser ? 'user' : 'ai'}>
        {/* Avatar (AI only, hidden on mobile) */}
        {!isUser && (
          <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full hidden sm:flex items-center justify-center bg-gradient-to-br from-[#1D3557] to-[#2A9D8F]">
            <Bot className="h-4 w-4 text-white/90" />
          </div>
        )}
        
        {/* Bubble shell */}
        <div className={cn(
          "relative max-w-[var(--bubble-max)] sm:max-w-[min(70ch,var(--bubble-max-md))]",
          isUser ? "self-end" : "self-start"
        )}>
          <div className={cn(
            "whitespace-pre-wrap break-words",
            "rounded-[var(--bubble-radius)] border shadow-sm",
            "px-3.5 py-2.5 leading-[1.45]",
            "shadow-[var(--bubble-shadow)]",
            isUser 
              ? "bg-[var(--me-bg)] border-[var(--me-brd)] text-[var(--me-fg)]" 
              : "bg-[var(--ai-bg)] border-[var(--ai-brd)] text-[var(--ai-fg)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
          )}>
            <div className="text-[15px] leading-[1.45]">
              {isUser ? (
                <p className="m-0 break-words">{message.content}</p>
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
                <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:font-semibold prose-a:text-[#2A9D8F] prose-a:no-underline hover:prose-a:underline prose-code:text-[0.9em]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#2A9D8F] hover:underline break-words" />,
                      h1: ({ children }) => <h3 className="text-[15px] font-semibold mb-2 mt-0 text-gray-900">{children}</h3>,
                      h2: ({ children }) => <h4 className="text-[15px] font-semibold mb-2 mt-2 text-gray-900">{children}</h4>,
                      h3: ({ children }) => <h4 className="text-[15px] font-semibold mb-2 mt-2 text-gray-900">{children}</h4>,
                      p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 break-words">{children}</p>,
                      ul: ({ children }) => <ul className="my-2 pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="my-2 pl-5">{children}</ol>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      code: ({ inline, children, ...props }: any) => 
                        inline ? (
                          <code className="bg-[rgba(2,16,32,0.06)] border border-[rgba(2,16,32,0.05)] rounded-md px-1 py-0.5 text-[0.9em]" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="font-mono text-[12.5px]" {...props}>{children}</code>
                        ),
                      pre: ({ children }) => (
                        <pre className="relative mt-2 overflow-auto rounded-lg border border-black/10 bg-white/85 backdrop-blur px-3 py-2 text-[12.5px] leading-[1.45]">
                          {children}
                        </pre>
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
          
          {/* Timestamp + status row */}
          <div className={cn(
            "mt-1 text-[11px] leading-none select-none",
            "text-[var(--meta-fg)]",
            isUser ? "text-right pr-1" : "text-left pl-1"
          )}>
            {time}
            {!isUser && message.metadata?.latencyMs && (
              <> • {message.metadata.latencyMs < 1000 ? 
                `${message.metadata.latencyMs}ms` : 
                `${(message.metadata.latencyMs / 1000).toFixed(1)}s`
              }</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;