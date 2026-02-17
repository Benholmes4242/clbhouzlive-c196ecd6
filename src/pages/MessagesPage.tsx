import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle, Plus, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationList, ChatView, NewConversationModal, NotificationPrompt } from '@/components/messaging';
import { ConversationSearchBar } from '@/components/messaging/ConversationSearchBar';
import { OfflineBanner } from '@/components/messaging/OfflineBanner';
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
  
  useHideBottomNav();
  
  const { state: pushState, enable: enablePush, isLoading: pushLoading } = usePushNotifications();
  useInAppNotifications();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    urlConversationId || null
  );
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationTab, setNewConversationTab] = useState<'direct' | 'group'>('direct');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const newParam = searchParams.get('new');
    if (newParam === 'dm') {
      setShowNewConversation(true);
      setNewConversationTab('direct');
      setSearchParams({}, { replace: true });
    } else if (newParam === 'group') {
      setShowNewConversation(true);
      setNewConversationTab('group');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(() => {
    return localStorage.getItem('notification_prompt_dismissed') === 'true';
  });

  const showNotificationPrompt = !pushLoading && 
    pushState === 'prompt' && 
    !notificationPromptDismissed;

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
      <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Please log in to view messages.</p>
          <Button 
            onClick={() => navigate('/auth')} 
            className="mt-4 rounded-full"
          >
            Log in
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile && selectedConversationId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="relative z-10 flex flex-col h-full">
          <OfflineBanner />
          <ChatView 
            conversationId={selectedConversationId} 
            onBack={handleBack} 
          />
        </div>
      </div>
    );
  }

  // Mobile: Conversation list
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="relative z-10 flex flex-col min-h-screen">
          <OfflineBanner />
          {/* Header */}
          <header 
            className="flex-none px-[18px] flex items-center justify-between"
            style={{
              paddingTop: 'calc(54px + env(safe-area-inset-top, 0px))',
              height: 'calc(56px + 54px + env(safe-area-inset-top, 0px))',
              background: 'rgba(248,250,252,0.9)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <button
              onClick={() => navigate('/hub')}
              className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
              aria-label="Back to Hub"
            >
              <ChevronLeft className="w-5 h-5 text-foreground/60" />
            </button>

            <span className="text-[16px] font-semibold" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>Messages</span>

            <button 
              onClick={handleNewConversation}
              className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
              aria-label="New conversation"
            >
              <Plus className="w-5 h-5 text-foreground/60" />
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
          
          {showNotificationPrompt && (
            <div className="px-4 pb-3">
              <NotificationPrompt
                onEnable={handleEnablePush}
                onDismiss={handleDismissNotificationPrompt}
              />
            </div>
          )}
          
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
            initialTab={newConversationTab}
          />
        </div>
      </div>
    );
  }

  // Desktop: Side-by-side layout
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="relative z-10 h-screen max-w-6xl mx-auto px-4 py-4 flex flex-col">
        <header 
          className="flex-none px-4 flex items-center justify-between mb-4 rounded-2xl"
          style={{
            height: '56px',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          <button
            onClick={() => navigate('/hub')}
            className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
            aria-label="Back to Hub"
          >
            <ChevronLeft className="w-5 h-5 text-foreground/60" />
          </button>

          <span className="text-[16px] font-semibold" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>Messages</span>

          <button 
            onClick={handleNewConversation}
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
            aria-label="New conversation"
          >
            <Plus className="w-5 h-5 text-foreground/60" />
          </button>
        </header>
        
        {showNotificationPrompt && (
          <NotificationPrompt
            onEnable={handleEnablePush}
            onDismiss={handleDismissNotificationPrompt}
            className="mb-4 rounded-[18px]"
          />
        )}
        
        <div className="flex flex-1 rounded-[20px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.45)', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
          <div className="w-80 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
              <ConversationSearchBar
                value={searchInput}
                onChange={handleSearchChange}
                onNewConversation={handleNewConversation}
                hideNewButton
              />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId || undefined}
                searchQuery={searchQuery}
                onNewConversation={handleNewConversation}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedConversationId ? (
              <ChatView 
                conversationId={selectedConversationId} 
                onBack={handleBack} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.5)' }}>
                    <MessageCircle className="h-8 w-8 text-warm-stone-400" />
                  </div>
                  <h2 className="font-semibold text-lg mb-1" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>
                    Select a conversation
                  </h2>
                  <p className="text-sm max-w-[240px] mx-auto" style={{ color: '#78716C' }}>
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
          initialTab={newConversationTab}
        />
      </div>
    </div>
  );
};

export default MessagesPage;
