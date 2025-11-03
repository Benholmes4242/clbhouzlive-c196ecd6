import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEchoConversationsContext } from '@/features/echo/components/EchoConversationsProvider';
import { useEchoDeepLink } from '@/features/echo/hooks/useEchoDeepLink';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { echoLinks } from '@/features/echo/utils/echoLinks';
import { toast } from 'sonner';
import ChatMessageComponent from '@/components/ai-chat/ChatMessage';

export function ChatDetailPane() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { conversations, selectConversation } = useEchoConversationsContext();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  
  useEchoDeepLink();

  // Find and select conversation
  React.useEffect(() => {
    if (id) {
      selectConversation(id);
    }
  }, [id, selectConversation]);

  const conversation = conversations.find(c => c.id === id);

  const copyMessageLink = (messageId: string) => {
    const link = `${window.location.origin}${echoLinks.chat(id!, { msgId: messageId })}`;
    navigator.clipboard.writeText(link);
    setCopiedId(messageId);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-white/60 bg-gradient-to-b from-black via-[#0A0A0A] to-black">
        <p>Conversation not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/hub/echo/history')}
          className="bg-white/05 border-white/20 text-white hover:bg-white/10"
        >
          Back to History
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-black via-[#0A0A0A] to-black">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/hub/echo/history')}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{conversation.title}</div>
          <div className="text-xs text-white/60">
            {conversation.messages.length} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3 max-w-3xl mx-auto">
          {conversation.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className="group relative"
              >
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? 'bg-white/10 text-white rounded-br-md'
                        : 'bg-white/05 text-white border border-white/10 rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    {msg.meta?.error && (
                      <div className="mt-2 text-xs text-red-400">
                        Error: {msg.meta.error}
                      </div>
                    )}
                  </div>
                </div>
                {/* Copy link button */}
                <button
                  onClick={() => copyMessageLink(msg.id)}
                  className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-md"
                  title="Copy link to this message"
                >
                  {copiedId === msg.id ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/60" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
