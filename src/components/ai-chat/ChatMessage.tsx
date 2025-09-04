import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, MoreHorizontal, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SwingReview } from '@/components/swing-review/SwingReview';
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
  };
}

interface ChatMessageProps {
  message: ChatMessage;
  onSaveToInsights: (message: ChatMessage) => void;
  onRequestDetail: (content: string) => void;
  onAskEcho?: (prompt: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onSaveToInsights, 
  onRequestDetail,
  onAskEcho 
}) => {
  const isUser = message.type === 'user';
  
  // Use metadata flag for save action instead of brittle string includes
  const showSaveOption = !!message.metadata?.save_card;
  const showDetailOption = !isUser && !message.content.includes('Explain fully');

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
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-orange-100 text-orange-700' : 'bg-muted'
          }`}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-orange-50 text-orange-900 border border-orange-200' 
              : 'bg-muted'
          }`}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isUser ? (
                <p className="m-0">{message.content}</p>
              ) : swingAnalysisData ? (
                <SwingReview
                  videoUrl={message.metadata!.videoUrl!}
                  summary={swingAnalysisData.summary}
                  phases={swingAnalysisData.phases}
                  priorityFix={swingAnalysisData.priorityFix}
                  drills={swingAnalysisData.drills}
                  onSaveToInsights={() => onSaveToInsights(message)}
                  onAskEcho={onAskEcho}
                />
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
        
        <div className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {time}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;