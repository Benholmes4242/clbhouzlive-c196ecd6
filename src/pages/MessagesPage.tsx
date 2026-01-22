import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationList, ChatView, NewConversationModal, NotificationPrompt } from '@/components/messaging';
import { ConversationSearchBar } from '@/components/messaging/ConversationSearchBar';
import { PageRoot } from '@/components/layout/PageRoot';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const { user } = useSupabaseSession();
  const { loading } = useMessaging();
  const isMobile = useIsMobile();
  
  // Hide bottom navigation on messages pages
  useHideBottomNav();
  
  // Push notifications
  const { state: pushState, enable: enablePush, isLoading: pushLoading } = usePushNotifications();
  
  // In-app notifications
  useInAppNotifications();
  
  // State
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    urlConversationId || null
  );
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification prompt state
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(() => {
    return localStorage.getItem('notification_prompt_dismissed') === 'true';
  });

  const showNotificationPrompt = !pushLoading && 
    pushState === 'prompt' && 
    !notificationPromptDismissed;

  // Debounced search
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const handleDismissNotificationPrompt = useCallback(() => {
    setNotificationPromptDismissed(true);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  }, []);
  
  const handleEnablePush = useCallback(async (): Promise<boolean> => {
    return await enablePush();
  }, [enablePush]);

  // Sync URL param to state
  useEffect(() => {
    if (urlConversationId) {
      setSelectedConversationId(urlConversationId);
    }
  }, [urlConversationId]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    navigate(`/messages/${id}`, { replace: true });
  };

  const handleBack = () => {
    setSelectedConversationId(null);
    navigate('/messages', { replace: true });
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    navigate(`/messages/${conversationId}`, { replace: true });
  };

  const handleNewConversation = useCallback(() => {
    setShowNewConversation(true);
  }, []);

  if (!user) {
    return (
      <PageRoot className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
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

  // Mobile: Full-screen chat when conversation selected (no global header)
  if (isMobile && selectedConversationId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F8FAFC' }}>
        <ChatView 
          conversationId={selectedConversationId} 
          onBack={handleBack} 
        />
      </div>
    );
  }

  // Mobile: Conversation list (uses global header)
  if (isMobile) {
    return (
      <PageRoot className="min-h-screen flex flex-col" style={{ background: '#F8FAFC' }}>
        {/* Notification Prompt */}
        {showNotificationPrompt && (
          <div className="px-4 pt-3">
            <NotificationPrompt
              onEnable={handleEnablePush}
              onDismiss={handleDismissNotificationPrompt}
            />
          </div>
        )}
        
        {/* Search Bar with FAB */}
        <div className="px-4 py-3">
          <ConversationSearchBar
            value={searchInput}
            onChange={handleSearchChange}
            onNewConversation={handleNewConversation}
          />
        </div>
        
        {/* Conversation List - WhatsApp style */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId || undefined}
            searchQuery={searchQuery}
            onNewConversation={handleNewConversation}
          />
        </div>
        
        <NewConversationModal
          open={showNewConversation}
          onOpenChange={setShowNewConversation}
          onConversationCreated={handleConversationCreated}
        />
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
          <div className="w-80 flex-shrink-0 border-r border-border/60 flex flex-col bg-[#F8FAFC]">
            {/* Search Bar */}
            <div className="p-3 border-b border-border/30">
              <ConversationSearchBar
                value={searchInput}
                onChange={handleSearchChange}
                onNewConversation={handleNewConversation}
              />
            </div>
            
            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId || undefined}
                searchQuery={searchQuery}
                onNewConversation={handleNewConversation}
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
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
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
