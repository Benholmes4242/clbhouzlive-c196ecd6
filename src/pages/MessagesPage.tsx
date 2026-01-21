import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationList, ChatView, NewConversationModal, NotificationPrompt } from '@/components/messaging';
import { PageRoot } from '@/components/layout/PageRoot';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { cn } from '@/lib/utils';

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
              {/* Notification Prompt */}
              {showNotificationPrompt && (
                <NotificationPrompt
                  onEnable={handleEnablePush}
                  onDismiss={handleDismissNotificationPrompt}
                />
              )}
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h1 className="font-display text-xl font-bold">Messages</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewConversation(true)}
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
    <PageRoot className="min-h-screen bg-background">
      <div className="h-[calc(100vh-80px)] max-w-6xl mx-auto px-4 py-4 flex flex-col">
        {/* Notification Prompt (Desktop) */}
        {showNotificationPrompt && (
          <NotificationPrompt
            onEnable={handleEnablePush}
            onDismiss={handleDismissNotificationPrompt}
            className="mb-4 rounded-lg"
          />
        )}
        
        <div className="flex flex-1 rounded-lg border border-border overflow-hidden bg-card">
          {/* Left: Conversation List */}
          <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h1 className="font-display text-lg font-bold">Messages</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewConversation(true)}
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

export default MessagesPage;
