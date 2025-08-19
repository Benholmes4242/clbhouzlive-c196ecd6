import React from 'react';
import { Button } from '@/components/ui/button';
import ChatMessageComponent from './ChatMessage';

interface ChatPanelProps {
  messages: any[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<any>;
  suggestedPrompts: string[];
  onPromptClick: (prompt: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  scrollAreaRef,
  suggestedPrompts,
  onPromptClick
}) => {
  return (
    <div className="h-full min-h-0">
      <div className="p-4 min-h-full flex flex-col">
        {messages.length === 0 ? (
          <div className="py-8">
            <div className="text-center text-muted-foreground">
              <p className="mb-6">
                I'm your personal tour caddie.<br />
                Ask me anything, anytime, I've got you.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Try asking:</p>
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="block mx-auto text-xs max-w-xs"
                    onClick={() => onPromptClick(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4">
            {messages.map((message, index) => (
              <ChatMessageComponent
                key={message.id || index}
                message={message}
                onSaveToInsights={() => {}}
                onRequestDetail={() => {}}
              />
            ))}
            {isLoading && (
              <div className="flex justify-center py-2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;