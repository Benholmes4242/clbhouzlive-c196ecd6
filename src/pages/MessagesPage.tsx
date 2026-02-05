import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Plus, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationList, ChatView, NewConversationModal, NotificationPrompt } from '@/components/messaging';
import { ConversationSearchBar } from '@/components/messaging/ConversationSearchBar';
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#E5E5EA] flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-[#8E8E93]" />
          </div>
          <p className="text-[#8E8E93]">Please log in to view messages.</p>
          <Button 
            onClick={() => navigate('/auth')} 
            className="mt-4 bg-[#DCF8C6] hover:bg-[#C5E8B0] text-[#1D1D1F] rounded-full"
          >
            Log in
          </Button>
        </div>
      </div>
    );
  }

  // Mobile: Full-screen chat when conversation selected
  if (isMobile && selectedConversationId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC]">
        <ChatView 
          conversationId={selectedConversationId} 
          onBack={handleBack} 
        />
      </div>
    );
  }

  // Mobile: Conversation list
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        {/* Header - Echo style */}
        <header 
          className="flex-none bg-[#F8FAFC] px-4 flex items-center justify-between"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            height: 'calc(56px + env(safe-area-inset-top, 0px))',
          }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate('/hub')}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
            aria-label="Back to Hub"
          >
            <ChevronLeft className="w-6 h-6 text-[#1D1D1F]" />
          </button>

          {/* Center title */}
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[17px] font-semibold text-[#1D1D1F]">Messages</span>
          </div>

          {/* New chat button */}
          <button 
            onClick={handleNewConversation}
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
            aria-label="New conversation"
          >
            <Plus className="w-6 h-6 text-[#1D1D1F]" />
          </button>
        </header>
        
        {/* Search bar */}
        <div className="px-4 py-2">
          <ConversationSearchBar
            value={searchInput}
            onChange={handleSearchChange}
            onNewConversation={handleNewConversation}
            hideNewButton
          />
        </div>
        
        {/* Notification Prompt */}
        {showNotificationPrompt && (
          <div className="px-4 pb-3">
            <NotificationPrompt
              onEnable={handleEnablePush}
              onDismiss={handleDismissNotificationPrompt}
            />
          </div>
        )}
        
        {/* Conversation List - WhatsApp style */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
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
      </div>
    );
  }

  // Desktop: Side-by-side layout
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="h-screen max-w-6xl mx-auto px-4 py-4 flex flex-col">
        {/* Desktop header - Echo style */}
        <header 
          className="flex-none bg-[#F8FAFC] px-4 flex items-center justify-between mb-4"
          style={{
            height: '56px',
          }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate('/hub')}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
            aria-label="Back to Hub"
          >
            <ChevronLeft className="w-6 h-6 text-[#1D1D1F]" />
          </button>

          {/* Center title */}
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[17px] font-semibold text-[#1D1D1F]">Messages</span>
          </div>

          {/* New chat button */}
          <button 
            onClick={handleNewConversation}
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
            aria-label="New conversation"
          >
            <Plus className="w-6 h-6 text-[#1D1D1F]" />
          </button>
        </header>
        
        {/* Notification Prompt (Desktop) */}
        {showNotificationPrompt && (
          <NotificationPrompt
            onEnable={handleEnablePush}
            onDismiss={handleDismissNotificationPrompt}
            className="mb-4 rounded-[18px]"
          />
        )}
        
        <div className="flex flex-1 rounded-[18px] overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          {/* Left: Conversation List */}
          <div className="w-80 flex-shrink-0 border-r border-[#E5E5EA] flex flex-col bg-[#F8FAFC]">
            {/* Search */}
            <div className="p-4 border-b border-[#E5E5EA]">
              <ConversationSearchBar
                value={searchInput}
                onChange={handleSearchChange}
                onNewConversation={handleNewConversation}
                hideNewButton
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
                  <div className="w-16 h-16 rounded-full bg-[#E5E5EA] flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-[#8E8E93]" />
                  </div>
                  <h2 className="font-semibold text-lg text-[#1D1D1F] mb-1">
                    Select a conversation
                  </h2>
                  <p className="text-sm text-[#8E8E93] max-w-[240px] mx-auto">
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
    </div>
  );
};

export default MessagesPage;
