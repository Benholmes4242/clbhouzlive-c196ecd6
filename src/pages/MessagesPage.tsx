import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatView } from '@/components/messaging/ChatView';
import { PageRoot } from '@/components/layout/PageRoot';
import { cn } from '@/lib/utils';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const { user } = useSupabaseSession();
  const { conversations, loading } = useMessaging();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Sync URL param to state
  useEffect(() => {
    if (urlConversationId) {
      setSelectedConversationId(urlConversationId);
    }
  }, [urlConversationId]);

  // Handle conversation selection
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    navigate(`/messages/${id}`, { replace: true });
  };

  // Handle back navigation
  const handleBack = () => {
    setSelectedConversationId(null);
    navigate('/messages', { replace: true });
  };

  // Handle new conversation (placeholder - you can implement NewConversationModal)
  const handleNewConversation = () => {
    // TODO: Open NewConversationModal
    console.log('Open new conversation modal');
  };

  if (!user) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Please log in to view messages.</p>
          </div>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-background">
      <div className="h-full flex flex-col">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1 h-full">
          {/* Left sidebar - Conversation list */}
          <div className="w-80 border-r border-border flex flex-col bg-background">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h1 className="font-display text-xl font-bold">Messages</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewConversation}
                className="rounded-full"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId || undefined}
              />
            </div>
          </div>

          {/* Right side - Chat view */}
          <div className="flex-1 flex flex-col">
            {selectedConversationId ? (
              <ChatView
                conversationId={selectedConversationId}
                onBack={handleBack}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">Select a conversation</h2>
                  <p className="text-muted-foreground text-sm max-w-[280px]">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-1 flex-col h-full">
          {selectedConversationId ? (
            // Show chat view full screen on mobile when conversation selected
            <ChatView
              conversationId={selectedConversationId}
              onBack={handleBack}
            />
          ) : (
            // Show conversation list on mobile when no conversation selected
            <>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h1 className="font-display text-xl font-bold">Messages</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewConversation}
                  className="rounded-full"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversationId || undefined}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </PageRoot>
  );
};

export default MessagesPage;
