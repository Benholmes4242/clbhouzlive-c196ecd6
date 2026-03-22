import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle, Plus, ChevronLeft, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { ConversationList, ChatView, NewConversationModal, NotificationPrompt } from '@/components/messaging';
import { ConversationSearchBar } from '@/components/messaging/ConversationSearchBar';
import { OfflineBanner } from '@/components/messaging/OfflineBanner';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';

function MessagesPageInner() {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const { user } = useSupabaseSession();
  const { loading, conversations } = useMessagingContext();
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
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'groups'>('all');
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
    try {
      return localStorage.getItem('notification_prompt_dismissed') === 'true';
    } catch {
      return false;
    }
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
    try {
      localStorage.setItem('notification_prompt_dismissed', 'true');
    } catch {
      // Silently fail in WebView contexts
    }
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
      <div className="min-h-screen flex items-center justify-center relative bg-background">
        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Please log in to view messages.</p>
          <Button 
            onClick={() => navigate('/auth')} 
            className="mt-4 rounded-full bg-[hsl(38,92%,50%)] hover:bg-[hsl(36,84%,46%)] text-white border-0"
          >
            Log in
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile && selectedConversationId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
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
    const totalUnread = conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) ?? 0;
    
    return (
      <div className="min-h-screen flex flex-col relative bg-[#F8FAFC]">
        <div className="relative z-10 flex flex-col min-h-screen bg-[#F8FAFC]">
          <OfflineBanner />
          {/* Header */}
          <header 
            className="flex-none px-[18px] flex items-center justify-between"
            style={{
              paddingTop: '8px',
              height: '56px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
              style={{ background: 'rgba(0,0,0,0.05)' }}
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" style={{ color: '#475569' }} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-foreground font-dm-sans">Messages</span>
              {totalUnread > 0 && (
                <span
                  className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: 'hsl(38,92%,50%)' }}
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>

            <button 
              onClick={handleNewConversation}
              className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
              style={{
                background: 'hsl(38,92%,50%)',
                boxShadow: '0 2px 8px rgba(245,166,35,0.35)',
              }}
              aria-label="New conversation"
            >
              <PenSquare className="w-[17px] h-[17px] text-white" strokeWidth={2.2} />
            </button>
          </header>
          
          {/* Search bar */}
          <div className="px-4 pt-2 pb-1">
            <div
              className="flex items-center gap-2.5 px-3 rounded-xl"
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                height: 40,
              }}
            >
              <ConversationSearchBar
                value={searchInput}
                onChange={handleSearchChange}
                onNewConversation={handleNewConversation}
                hideNewButton
              />
            </div>
          </div>

          {/* Filter chips */}
          <FilterChips
            totalUnread={totalUnread}
            conversationFilter={conversationFilter}
            onFilterChange={setConversationFilter}
          />
          
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
              filterType={conversationFilter}
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
    <div className="min-h-screen relative bg-background">
      <div className="relative z-10 h-screen max-w-6xl mx-auto px-4 py-4 flex flex-col">
        <header 
          className="flex-none px-4 flex items-center justify-between mb-4 rounded-2xl"
          style={{
            height: '56px',
            background: 'hsl(var(--background) / 0.9)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground/60" />
          </button>

          <span className="text-[16px] font-semibold text-foreground font-dm-sans">Messages</span>

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
        
        <div className="flex flex-1 rounded-[20px] overflow-hidden border border-border" style={{ background: 'hsl(var(--background) / 0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="w-80 flex-shrink-0 flex flex-col border-r border-border">
            <div className="p-4 border-b border-border">
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
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted/50">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="font-semibold text-lg mb-1 text-foreground font-dm-sans">
                    Select a conversation
                  </h2>
                  <p className="text-sm max-w-[240px] mx-auto text-muted-foreground">
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
}

const MessagesPage = () => {
  return <MessagesPageInner />;
};

export default MessagesPage;
