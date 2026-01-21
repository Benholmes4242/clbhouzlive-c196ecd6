import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, PenSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationList, ChatView, NewConversationModal, NotificationPrompt } from '@/components/messaging';
import { PageRoot } from '@/components/layout/PageRoot';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const { user } = useSupabaseSession();
  const { conversations, loading } = useMessaging();
  const isMobile = useIsMobile();
  
  // Push notifications - using existing OneSignal-based hook
  const { state: pushState, enable: enablePush, isLoading: pushLoading } = usePushNotifications();
  
  // In-app notifications (toasts when in different conversation)
  useInAppNotifications();
  
  // Track selected conversation - sync with URL
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    urlConversationId || null
  );
  
  // New conversation modal state
  const [showNewConversation, setShowNewConversation] = useState(false);
  
  // Notification prompt dismissed state (persisted in localStorage)
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(() => {
    return localStorage.getItem('notification_prompt_dismissed') === 'true';
  });

  // Should show notification prompt - show when push is available and in 'prompt' state
  const showNotificationPrompt = !pushLoading && 
    pushState === 'prompt' && 
    !notificationPromptDismissed;

  // Handle dismissing the notification prompt
  const handleDismissNotificationPrompt = useCallback(() => {
    setNotificationPromptDismissed(true);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  }, []);
  
  // Handle enabling push notifications
  const handleEnablePush = useCallback(async (): Promise<boolean> => {
    return await enablePush();
  }, [enablePush]);

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

  // Handle new conversation created
  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    navigate(`/messages/${conversationId}`, { replace: true });
  };

  if (!user) {
    return (
      <PageRoot className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#e2e8f0] flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
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
      <PageRoot className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <div className="h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col">
          {selectedConversationId ? (
            <ChatView 
              conversationId={selectedConversationId} 
              onBack={handleBack} 
            />
          ) : (
            <>
              {/* Notification Prompt */}
              {showNotificationPrompt && (
                <div className="px-4 pt-4">
                  <NotificationPrompt
                    onEnable={handleEnablePush}
                    onDismiss={handleDismissNotificationPrompt}
                  />
                </div>
              )}
              
              {/* Header with backdrop blur */}
              <div 
                className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
                style={{
                  background: 'rgba(248, 250, 252, 0.85)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderBottom: '1px solid hsl(var(--border) / 0.5)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="h-9 w-9"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewConversation(true)}
                  className="h-9 w-9"
                >
                  <PenSquare className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {conversations.length === 0 && !loading ? (
                  <EmptyState onNewMessage={() => setShowNewConversation(true)} />
                ) : (
                  <ConversationList
                    onSelectConversation={handleSelectConversation}
                    selectedConversationId={selectedConversationId || undefined}
                  />
                )}
              </div>
              
              {/* New Conversation Modal */}
              <NewConversationModal
                open={showNewConversation}
                onOpenChange={setShowNewConversation}
                onConversationCreated={handleConversationCreated}
              />
            </>
          )}
        </div>
      </PageRoot>
    );
  }

  // Desktop: Side-by-side layout
  return (
    <PageRoot className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <div className="h-[calc(100vh-80px)] max-w-6xl mx-auto px-4 py-4 flex flex-col">
        {/* Notification Prompt (Desktop) */}
        {showNotificationPrompt && (
          <NotificationPrompt
            onEnable={handleEnablePush}
            onDismiss={handleDismissNotificationPrompt}
            className="mb-4 rounded-2xl"
          />
        )}
        
        <div className="flex flex-1 rounded-2xl border border-border/60 overflow-hidden bg-white shadow-sm">
          {/* Left: Conversation List */}
          <div className="w-80 flex-shrink-0 border-r border-border/60 flex flex-col">
            <div 
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: 'rgba(248, 250, 252, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid hsl(var(--border) / 0.5)',
              }}
            >
              <h1 className="font-display text-lg font-bold text-foreground">Messages</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewConversation(true)}
                className="h-8 w-8"
              >
                <PenSquare className="h-4 w-4" />
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
          <div className="flex-1 flex flex-col bg-[#F8FAFC]">
            {selectedConversationId ? (
              <ChatView 
                conversationId={selectedConversationId} 
                onBack={handleBack} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#e2e8f0] flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-primary" />
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
        
        {/* New Conversation Modal */}
        <NewConversationModal
          open={showNewConversation}
          onOpenChange={setShowNewConversation}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </PageRoot>
  );
};

// Empty state component
function EmptyState({ onNewMessage }: { onNewMessage: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#e2e8f0] flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground text-lg mb-1">No messages yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Start a conversation with your golf buddies
      </p>
      <Button 
        onClick={onNewMessage} 
        className="gap-2 bg-[#e2e8f0] text-slate-800 hover:bg-[#cbd5e1]"
      >
        <PenSquare className="h-4 w-4" />
        New Message
      </Button>
    </div>
  );
}

export default MessagesPage;
