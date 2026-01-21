import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationList, ChatView } from '@/components/messaging';
import { PageRoot } from '@/components/layout/PageRoot';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const { user } = useSupabaseSession();
  const { conversations, loading } = useMessaging();
  const isMobile = useIsMobile();
  
  // Track selected conversation - sync with URL
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    urlConversationId || null
  );

  // Sync URL param to state
  useEffect(() => {
    if (urlConversationId) {
      setSelectedConversationId(urlConversationId);
    }
  }, [urlConversationId]);

  // Handle conversation selection
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    // Update URL
    navigate(`/messages/${id}`, { replace: true });
  };

  // Handle back from chat view
  const handleBack = () => {
    setSelectedConversationId(null);
    navigate('/messages', { replace: true });
  };

  // Handle new conversation FAB
  const handleNewConversation = () => {
    // TODO: Open NewConversationModal
    console.log('Open new conversation modal');
  };

  if (!user) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please log in to view messages.</p>
            <Button 
              onClick={() => navigate('/auth')} 
              className="mt-4"
            >
              Log in
            </Button>
          </div>
        </div>
      </PageRoot>
    );
  }

  // Mobile: Show either list or chat, not both
  if (isMobile) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col">
          {selectedConversationId ? (
            <ChatView 
              conversationId={selectedConversationId} 
              onBack={handleBack} 
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h1 className="font-display text-xl font-bold">Messages</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewConversation}
                  className="h-9 w-9"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversationId || undefined}
                />
              </div>
            </>
          )}
        </div>
      </PageRoot>
    );
  }

  // Desktop: Side-by-side layout
  return (
    <PageRoot className="min-h-screen bg-background">
      <div className="h-[calc(100vh-80px)] max-w-6xl mx-auto px-4 py-4">
        <div className="flex h-full rounded-lg border border-border overflow-hidden bg-card">
          {/* Left: Conversation List */}
          <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h1 className="font-display text-lg font-bold">Messages</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewConversation}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId || undefined}
              />
            </div>
          </div>

          {/* Right: Chat View or Empty State */}
          <div className="flex-1 flex flex-col">
            {selectedConversationId ? (
              <ChatView 
                conversationId={selectedConversationId} 
                onBack={handleBack} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="rounded-full bg-muted p-6 mb-4 mx-auto w-fit">
                    <MessageCircle className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="font-semibold text-lg text-foreground mb-1">
                    Select a conversation
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageRoot>
  );
};

export default MessagesPage;
