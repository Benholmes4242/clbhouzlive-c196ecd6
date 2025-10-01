import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, MoreHorizontal, User, Bot, Globe, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SwingReview } from '@/components/swing-review/SwingReview';
import { CoachPrompt } from '@/components/swing-review/CoachPrompt';
import { parseSwingAnalysis } from '@/utils/swingAnalysisParser';

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
    <div className="space-y-2" data-echo-group>
      <div className={`flex ${isUser ? 'justify-end' : 'items-start'} gap-2`} data-echo-msg={isUser ? 'user' : 'ai'}>
        {!isUser && (
          <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1D3557] to-[#2A9D8F]">
            <Bot className="h-4 w-4 text-white/90" />
          </div>
        )}
        
        <div className={`max-w-[86%] rounded-[18px] px-4 py-3 shadow-[0_6px_20px_rgba(0,0,0,0.06)] ${
          isUser 
            ? 'bg-[#3da0a9]/7 border border-[#3da0a9]/20 text-gray-900 shadow-[0_6px_20px_rgba(61,160,169,0.15)]' 
            : 'bg-white/90 backdrop-blur border border-black/5 text-gray-900'
        }`}>
            <div className="text-[15px] leading-[1.35]">
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#2A9D8F] hover:underline break-words" />,
                    h1: ({ children }) => <h3 className="text-[15px] font-semibold mb-2 mt-0">{children}</h3>,
                    h2: ({ children }) => <h4 className="text-[15px] font-semibold mb-2 mt-2">{children}</h4>,
                    h3: ({ children }) => <h4 className="text-[15px] font-semibold mb-2 mt-2">{children}</h4>,
                    p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 break-words">{children}</p>,
                    ul: ({ children }) => <ul className="my-2 pl-5">{children}</ul>,
                    ol: ({ children }) => <ol className="my-2 pl-5">{children}</ol>,
                    li: ({ children }) => <li className="my-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ inline, children, ...props }: any) => 
                      inline ? (
                        <code className="bg-[rgba(2,16,32,0.06)] border border-[rgba(2,16,32,0.05)] rounded-md px-1 py-0.5 text-[.92em]" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code {...props}>{children}</code>
                      ),
                    pre: ({ children }) => (
                      <pre className="mt-2 overflow-auto rounded-lg bg-[#0b2537] text-white text-[13px] leading-[1.45] p-3 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
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
                  className="text-xs h-7"
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  Save to Insights
                </Button>
              </div>
            )}
        </div>
      </div>
      
      <div className={`mt-1 text-[11px] leading-none text-gray-500/90 select-none ${isUser ? 'text-right' : 'text-left'}`}>
        {time}
        {!isUser && message.metadata?.latencyMs && (
          <> • {message.metadata.latencyMs < 1000 ? 
            `${message.metadata.latencyMs}ms` : 
            `${(message.metadata.latencyMs / 1000).toFixed(1)}s`
          }</>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;