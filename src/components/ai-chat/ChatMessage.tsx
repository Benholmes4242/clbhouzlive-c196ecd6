import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, MoreHorizontal, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    save_card?: string;
    tags?: string[];
    category?: string;
  };
}

interface ChatMessageProps {
  message: ChatMessage;
  onSaveToInsights: (message: ChatMessage) => void;
  onRequestDetail: (content: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onSaveToInsights, 
  onRequestDetail 
}) => {
  const isUser = message.type === 'user';
  const showSaveOption = message.content.includes('Want this saved to Insights?');
  const showDetailOption = !isUser && !message.content.includes('Explain fully');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isUser ? (
                <p className="m-0">{message.content}</p>
              ) : (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-0">{children}</h3>,
                    h2: ({ children }) => <h4 className="text-sm font-semibold mb-2 mt-2">{children}</h4>,
                    h3: ({ children }) => <h4 className="text-sm font-semibold mb-2 mt-2">{children}</h4>,
                    p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
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
            
            {/* Action buttons for AI messages */}
            {!isUser && (
              <div className="flex gap-2 mt-3">
                {showSaveOption && message.metadata && (
                  <Button
                    onClick={() => onSaveToInsights(message)}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                  >
                    <Bookmark className="h-3 w-3 mr-1" />
                    Save to Insights
                  </Button>
                )}
                {showDetailOption && (
                  <Button
                    onClick={() => onRequestDetail(message.content)}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                  >
                    <MoreHorizontal className="h-3 w-3 mr-1" />
                    More Detail
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;