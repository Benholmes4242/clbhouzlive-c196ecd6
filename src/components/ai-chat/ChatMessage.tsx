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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`w-full ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-[#3da0a9]/10 text-[#3da0a9]' : 'bg-muted'
          }`}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-[#3da0a9]/5 text-[#2d7580] border border-[#3da0a9]/20' 
              : 'bg-muted'
          }`}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isUser ? (
                <p className="m-0">{message.content}</p>
              ) : swingAnalysisData ? (
                <>
                  <SwingReview
                    videoUrl={message.metadata!.videoUrl!}
                    summary={swingAnalysisData.summary}
                    phases={swingAnalysisData.phases}
                    priorityFix={swingAnalysisData.priorityFix}
                    drills={swingAnalysisData.drills}
                    onShare={() => onShare?.(message)}
                    onAddVoiceNote={() => onAddVoiceNote?.(message)}
                  />
                  <div className="mt-4">
                    <CoachPrompt
                      swingAnalysisId={message.id}
                      onOpen={() => {
                        // Open coach finder modal - we'll implement this properly
                        console.log('Open coach finder for analysis:', message.id);
                      }}
                    />
                  </div>
                </>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="underline break-words" />,
                    h1: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-0">{children}</h3>,
                    h2: ({ children }) => <h4 className="text-sm font-semibold mb-2 mt-2">{children}</h4>,
                    h3: ({ children }) => <h4 className="text-sm font-semibold mb-2 mt-2">{children}</h4>,
                    p: ({ children }) => <p className="text-sm mb-2 last:mb-0 break-words">{children}</p>,
                    ul: ({ children }) => <ul className="text-sm mb-2 ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="text-sm mb-2 ml-4">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
            
            {/* Tags from metadata */}
            {message.metadata?.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.metadata.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
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
        
        <div className={`flex items-center gap-2 text-xs text-muted-foreground mt-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span>{time}</span>
          {!isUser && message.metadata?.latencyMs && (
            <span className="opacity-60">
              {message.metadata.latencyMs < 1000 ? 
                `${message.metadata.latencyMs}ms` : 
                `${(message.metadata.latencyMs / 1000).toFixed(1)}s`
              }
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;