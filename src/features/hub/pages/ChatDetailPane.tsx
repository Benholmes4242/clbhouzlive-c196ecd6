/**
 * Chat Detail Pane
 * Full-page chat conversation view inside Hub
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEchoConversationsContext } from '@/features/echo/components/EchoConversationsProvider';
import { useEchoDeepLink } from '@/features/echo/hooks/useEchoDeepLink';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function ChatDetailPane() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { conversations, selectConversation } = useEchoConversationsContext();
  
  useEchoDeepLink();

  // Find and select conversation
  React.useEffect(() => {
    if (id) {
      selectConversation(id);
    }
  }, [id, selectConversation]);

  const conversation = conversations.find(c => c.id === id);

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-white/60">
        <p>Conversation not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/hub/echo/history')}
        >
          Back to History
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/hub/echo/history')}
          className="text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <div className="font-semibold text-white">{conversation.title}</div>
          <div className="text-xs text-white/60">
            {conversation.messages.length} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            data-msg-id={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/10 text-white'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.meta?.error && (
                <div className="mt-2 text-xs text-red-400">
                  Error: {msg.meta.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
