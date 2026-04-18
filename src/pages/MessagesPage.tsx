import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle, ChevronLeft, PenSquare } from 'lucide-react';
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

type ConversationFilterType = 'all' | 'unread' | 'groups';

function FilterChips({ totalUnread, conversationFilter, onFilterChange }: {
  totalUnread: number;
  conversationFilter: ConversationFilterType;
  onFilterChange: (f: ConversationFilterType) => void;
}) {
  const chips = [
    { key: 'all' as const, label: 'All' },
    { key: 'unread' as const, label: totalUnread > 0 ? `Unread · ${totalUnread}` : 'Unread' },
    { key: 'groups' as const, label: 'Groups' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, padding: '6px 16px' }}>
      {chips.map(chip => (
        <button
          key={chip.key}
          onClick={() => onFilterChange(chip.key)}
          style={{
            padding: '5px 13px',
            borderRadius: 99,
            fontSize: '12.5px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.12s',
            background: conversationFilter === chip.key ? '#0f172a' : 'rgba(15,23,42,0.05)',
            color: conversationFilter === chip.key ? '#fff' : '#64748b',
          }}
          className="active:scale-[0.97]"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

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
  const [conversationFilter, setConversationFilter] = useState<ConversationFilterType>('all');
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
    pushState === 'unknown' && 
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(0,0,0,0.05)' }}>
            <MessageCircle className="h-8 w-8" style={{ color: '#94a3b8' }} />
          </div>
          <p style={{ color: '#64748b' }}>Please log in to view messages.</p>
          <Button 
            onClick={() => navigate('/auth')} 
            className="mt-4 rounded-full border-0"
            style={{ background: '#F7931E', color: '#fff' }}
          >
            Log in
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile && selectedConversationId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F8FAFC' }}>
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
      <div className="min-h-screen flex flex-col" style={{ background: '#F8FAFC' }}>
        <OfflineBanner />
        
        {/* Header */}
        <header 
          className="flex-none flex items-center justify-between"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
            paddingBottom: 10,
            paddingLeft: 16,
            paddingRight: 16,
            background: '#F8FAFC',
            borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          }}
        >
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center active:scale-[0.97] transition-transform"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(15,23,42,0.05)',
              border: '0.5px solid rgba(15,23,42,0.10)',
            }}
            aria-label="Back"
          >
            <ChevronLeft style={{ color: '#475569' }} strokeWidth={2.5} className="w-5 h-5" />
          </button>

          {/* Title + badge */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
            <div className="flex items-center" style={{ gap: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Messages
              </span>
            {totalUnread > 0 && (
              <span
                className="flex items-center justify-center"
                style={{
                  minWidth: 20, height: 20, borderRadius: 99,
                  background: '#F7931E', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  padding: '0 5px',
                }}
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
            </div>
          </div>

          {/* Compose — ghost amber */}
          <button 
            onClick={handleNewConversation}
            className="flex items-center justify-center active:scale-[0.97] transition-transform"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(247,147,30,0.10)',
              border: '1px solid rgba(247,147,30,0.28)',
            }}
            aria-label="New conversation"
          >
            <PenSquare style={{ color: '#F7931E' }} strokeWidth={2.2} className="w-[17px] h-[17px]" />
          </button>
        </header>
        
        {/* Search bar */}
        <div style={{ margin: '8px 16px 4px', position: 'relative' }}>
          <ConversationSearchBar
            value={searchInput}
            onChange={handleSearchChange}
            onNewConversation={handleNewConversation}
            hideNewButton
          />
        </div>

        {/* Filter chips */}
        <FilterChips
          totalUnread={totalUnread}
          conversationFilter={conversationFilter}
          onFilterChange={setConversationFilter}
        />
        
        {/* Notification prompt */}
        {showNotificationPrompt && (
          <div style={{ margin: '8px 16px' }}>
            <NotificationPrompt
              onEnable={handleEnablePush}
              onDismiss={handleDismissNotificationPrompt}
            />
          </div>
        )}

        {/* Section label */}
        {!searchInput && conversationFilter === 'all' && conversations.length > 0 && (
          <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Recent</span>
          </div>
        )}
        
        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto pb-28">
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
    );
  }

  // Desktop: Side-by-side layout
  const totalUnread = conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) ?? 0;
  
  return (
    <div style={{ background: '#F0F2F5', minHeight: '100vh' }}>
      {/* Desktop header */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '12px 16px 0' }}>
        <header
          className="flex items-center justify-between"
          style={{
            height: 56,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            padding: '0 18px',
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center active:scale-[0.97] transition-transform"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(15,23,42,0.05)',
              border: '0.5px solid rgba(15,23,42,0.10)',
            }}
            aria-label="Back"
          >
            <ChevronLeft style={{ color: '#475569' }} strokeWidth={2.5} className="w-5 h-5" />
          </button>

          <div className="flex items-center" style={{ gap: 6 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Messages</span>
            {totalUnread > 0 && (
              <span
                className="flex items-center justify-center"
                style={{
                  minWidth: 20, height: 20, borderRadius: 99,
                  background: '#F7931E', color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '0 5px',
                }}
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>

          <button 
            onClick={handleNewConversation}
            className="flex items-center justify-center active:scale-[0.97] transition-transform"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(247,147,30,0.10)',
              border: '1px solid rgba(247,147,30,0.28)',
            }}
            aria-label="New conversation"
          >
            <PenSquare style={{ color: '#F7931E' }} strokeWidth={2.2} className="w-[17px] h-[17px]" />
          </button>
        </header>
      </div>

      {/* Two-pane container */}
      <div
        className="flex"
        style={{
          maxWidth: 1060, margin: '0 auto',
          borderRadius: 20, overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          height: 'calc(100vh - 100px)',
        }}
      >
        {/* Left sidebar */}
        <div
          className="flex flex-col"
          style={{
            width: 300, flexShrink: 0,
            background: '#F8FAFC',
            borderRight: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Sidebar search */}
          <div style={{ padding: '12px 12px 4px' }}>
            <ConversationSearchBar
              value={searchInput}
              onChange={handleSearchChange}
              onNewConversation={handleNewConversation}
              hideNewButton
            />
          </div>

          <FilterChips
            totalUnread={totalUnread}
            conversationFilter={conversationFilter}
            onFilterChange={setConversationFilter}
          />

          {showNotificationPrompt && (
            <div style={{ padding: '0 12px' }}>
              <NotificationPrompt
                onEnable={handleEnablePush}
                onDismiss={handleDismissNotificationPrompt}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <ConversationList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversationId || undefined}
              searchQuery={searchQuery}
              onNewConversation={handleNewConversation}
              filterType={conversationFilter}
            />
          </div>
        </div>

        {/* Right pane */}
        <div className="flex-1 flex flex-col">
          {selectedConversationId ? (
            <ChatView 
              conversationId={selectedConversationId} 
              onBack={handleBack} 
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ padding: 32 }}>
              {/* Concentric amber rings */}
              <div className="relative flex items-center justify-center" style={{ width: 80, height: 80, marginBottom: 20 }}>
                <div className="absolute rounded-full" style={{ width: 80, height: 80, background: 'rgba(247,147,30,0.06)' }} />
                <div className="absolute rounded-full" style={{ width: 56, height: 56, background: 'rgba(247,147,30,0.10)' }} />
                <div className="absolute rounded-full" style={{ width: 36, height: 36, background: 'rgba(247,147,30,0.15)' }} />
                <MessageCircle style={{ color: '#F7931E' }} className="w-5 h-5 relative z-10" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Select a conversation
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 240, marginBottom: 20 }}>
                Choose a conversation from the list or start a new one
              </p>
              <button
                onClick={handleNewConversation}
                className="flex items-center justify-center active:scale-[0.97] transition-transform"
                style={{
                  padding: '8px 20px', borderRadius: 99,
                  background: 'rgba(247,147,30,0.10)',
                  border: '1px solid rgba(247,147,30,0.25)',
                  color: '#F7931E', fontSize: 13, fontWeight: 600,
                  gap: 6,
                }}
              >
                <PenSquare className="w-4 h-4" />
                New Message
              </button>
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
  );
}

const MessagesPage = () => {
  return <MessagesPageInner />;
};

export default MessagesPage;
