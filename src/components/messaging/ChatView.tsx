import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AppLog } from '@/lib/logger';
import type { ConversationParticipant, ParticipantProfile, ParticipantWithProfile } from '@/types/messaging';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { usePresence } from '@/hooks/usePresence';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
 import { ChevronLeft, Loader2, ChevronDown } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { OnlineIndicator } from './OnlineIndicator';
import { GroupInfoPage } from './GroupInfoPage';
 import { ChatHeaderMenu } from './ChatHeaderMenu';
 import { ChatSearchBar } from './ChatSearchBar';
 import { SharedMediaGallery } from './SharedMediaGallery';
 import { EditMessageModal } from './EditMessageModal';
 import { DeleteMessageSheet } from './DeleteMessageSheet';
 import { ForwardMessageModal } from './ForwardMessageModal';
import type { MessageWithSender, ConversationWithDetails, MessageType } from '@/types/messaging';
import { supabase } from '@/integrations/supabase/client';

interface ChatViewProps {
  conversationId: string;
  onBack: () => void;
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('en-GB', { weekday: 'long' });
  }
  
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function groupMessagesByDate(messages: MessageWithSender[]): Map<string, MessageWithSender[]> {
  const groups = new Map<string, MessageWithSender[]>();
  
  messages.forEach(message => {
    const dateKey = new Date(message.created_at).toDateString();
    const existing = groups.get(dateKey) || [];
    existing.push(message);
    groups.set(dateKey, existing);
  });
  
  return groups;
}

function ChatSkeleton() {
  return (
    <div className="flex-1 p-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className="flex gap-2 max-w-[70%]">
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-56'} rounded-[18px]`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex justify-center py-5">
      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-medium tracking-[0.04em] uppercase font-dm-sans">
        {formatDateHeader(date)}
      </span>
    </div>
  );
}

export function ChatView({ conversationId, onBack }: ChatViewProps) {
  const { user } = useSupabaseSession();
  const { conversations, markAsRead, fetchConversations } = useMessagingContext();
  const { 
    messages, 
    loading, 
    hasMore, 
    loadMore, 
    sendMessage,
    editMessage,
    deleteMessage,
  } = useConversationMessages(conversationId);

  // Typing indicator
  const { typingUsers, setTyping, clearTyping } = useTypingIndicator(conversationId);
  
  // Message reactions
  const { reactions, toggleReaction } = useMessageReactions(conversationId);
  
  // Presence
  const { presenceMap, subscribeToPresence } = usePresence();

  const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [directConversation, setDirectConversation] = useState<ConversationWithDetails | null>(null);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
   const [unreadBelowCount, setUnreadBelowCount] = useState(0);
   const [showSearchBar, setShowSearchBar] = useState(false);
   const [showSharedMedia, setShowSharedMedia] = useState(false);
   const [editingMessage, setEditingMessage] = useState<MessageWithSender | null>(null);
   const [deletingMessage, setDeletingMessage] = useState<MessageWithSender | null>(null);
   const [forwardingMessage, setForwardingMessage] = useState<MessageWithSender | null>(null);
   const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
   // TODO: messageRefs is declared but never populated — MessageBubble components
   // need to register themselves via a callback ref for navigate-to-message to work.
   // handleNavigateToMessage will silently fail to scroll until this is implemented.
   const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
   const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Find current conversation from context
  const contextConversation = useMemo(() => 
    conversations.find(c => c.id === conversationId),
    [conversations, conversationId]
  );

  // Fetch conversation directly if not in context (archived conversations)
  useEffect(() => {
    if (!contextConversation && conversationId && user && !loadingDirect && !directConversation) {
      const fetchDirectConversation = async () => {
        setLoadingDirect(true);
        try {
          // Fetch conversation with participants
          const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select(`
              id, type, name, avatar_url, created_by, created_at, updated_at,
              last_message_at, last_message_preview,
              conversation_participants (
                id, conversation_id, user_id, role, joined_at,
                last_read_at, is_muted, is_archived
              )
            `)
            .eq('id', conversationId)
            .single();

          if (convError || !convData) {
            AppLog.error('[ChatView]', 'Error fetching conversation:', convError);
            return;
          }

          // Get all participant user IDs
          const rawParticipants = convData.conversation_participants as ConversationParticipant[] | null;
          const participantIds = (rawParticipants || [])
            .map(p => p.user_id)
            .filter((id): id is string => id !== null);

          // Fetch profiles for participants
          const { data: profiles } = await supabase
            .from('public_profiles')
            .select('id, username, display_name, profile_photo_url')
            .in('id', participantIds);

          // Build profile map
          const profilesMap = new Map<string, ParticipantProfile>();
          profiles?.forEach(profile => {
            if (profile.id) {
              profilesMap.set(profile.id, {
                id: profile.id,
                username: profile.username,
                display_name: profile.display_name,
                profile_photo_url: profile.profile_photo_url,
              });
            }
          });

          // Build participants with profiles
          const participants: ParticipantWithProfile[] = (rawParticipants || []).map(p => ({
            id: p.id,
            conversation_id: p.conversation_id,
            user_id: p.user_id,
            role: p.role as 'admin' | 'member',
            joined_at: p.joined_at,
            last_read_at: p.last_read_at,
            is_muted: p.is_muted,
            is_archived: p.is_archived,
            profile: p.user_id ? profilesMap.get(p.user_id) || null : null,
          }));

          setDirectConversation({
            id: convData.id,
            type: convData.type as ConversationWithDetails['type'],
            name: convData.name,
            avatar_url: convData.avatar_url,
            created_by: convData.created_by,
            created_at: convData.created_at,
            updated_at: convData.updated_at,
            last_message_at: convData.last_message_at,
            last_message_preview: convData.last_message_preview,
            participants,
            unread_count: 0,
          });
        } catch (err) {
          AppLog.error('[ChatView]', 'Error fetching direct conversation:', err);
        } finally {
          setLoadingDirect(false);
        }
      };

      fetchDirectConversation();
    }
  }, [contextConversation, conversationId, user, loadingDirect, directConversation]);

  // Use context conversation or directly fetched conversation
  const conversation = contextConversation || directConversation;

  // Get other user for DM (for presence)
  const otherUser = useMemo(() => {
    if (!conversation || !user || conversation.type !== 'direct') return null;
    return conversation.participants.find(p => p.user_id !== user.id);
  }, [conversation, user]);

  // Subscribe to other user's presence for DMs
  useEffect(() => {
    if (otherUser?.user_id) {
      subscribeToPresence([otherUser.user_id]);
    }
  }, [otherUser?.user_id, subscribeToPresence]);

  // Get presence status for other user
  const otherUserPresence = otherUser?.user_id ? presenceMap.get(otherUser.user_id) : null;

  // Get display info for conversation header
  const headerInfo = useMemo(() => {
    if (!conversation || !user) {
      return { name: 'Loading...', avatarUrl: null, initials: '...' };
    }

    if (conversation.type === 'direct') {
      const other = conversation.participants.find(p => p.user_id !== user.id);
      if (other?.profile) {
        const name = other.profile.display_name || other.profile.username || 'Unknown';
        return {
          name,
          avatarUrl: other.profile.profile_photo_url,
          initials: name.substring(0, 2).toUpperCase(),
        };
      }
      return { name: 'Unknown User', avatarUrl: null, initials: 'U' };
    }

    const name = conversation.name || 'Group Chat';
    return {
      name,
      avatarUrl: conversation.avatar_url,
      initials: name.substring(0, 2).toUpperCase(),
    };
  }, [conversation, user]);

   // Is this a group conversation (show sender info)?
   const isGroupChat = conversation?.type !== 'direct';
 
   // Get other user name for DM header menu
   const otherUserName = useMemo(() => {
     if (conversation?.type === 'direct') {
       const other = conversation.participants.find(p => p.user_id !== user?.id);
       return other?.profile?.display_name || other?.profile?.username || 'User';
     }
     return 'User';
   }, [conversation, user?.id]);

  // Create a map for quick reply-to lookup
  const messagesMap = useMemo(() => {
    const map = new Map<string, MessageWithSender>();
    messages.forEach(m => map.set(m.id, m));
    return map;
  }, [messages]);

  // Handle scroll to show/hide scroll-to-bottom FAB
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
    
    if (isNearBottom) {
      setUnreadBelowCount(0);
    }
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadBelowCount(0);
  }, []);

  // Cleanup highlight timer on unmount
  useEffect(() => {
    return () => clearTimeout(highlightTimerRef.current);
  }, []);

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  };

  const handleSend = useCallback(async (
    content: string, 
    replyToId?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    messageType?: string,
    metadata?: Record<string, unknown>
  ) => {
    clearTyping();
    const finalMessageType = messageType || mediaType || 'text';
    await sendMessage(content, replyToId, mediaUrl, finalMessageType, metadata);
  }, [sendMessage, clearTyping]);

  const handleSendVoiceNote = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!user) return;
    
    try {
      const fileName = `voice-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
      const filePath = `${user.id}/voice-notes/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('message-media')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
        });
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('message-media')
        .getPublicUrl(filePath);
      
      await sendMessage(
        '🎤 Voice message', 
        null, 
        publicUrl, 
        'voice',
        { duration }
      );
    } catch (error) {
      AppLog.error('[ChatView]', 'Error sending voice note:', error);
    }
  }, [user, sendMessage]);

  const handleReply = (message: MessageWithSender) => {
    setReplyingTo(message);
  };

   const handleEdit = (message: MessageWithSender) => {
     setEditingMessage(message);
  };

   const handleDelete = (message: MessageWithSender) => {
     setDeletingMessage(message);
  };

  const handleSaveEdit = async (newContent: string) => {
     if (editingMessage) {
       await editMessage(editingMessage.id, newContent);
       setEditingMessage(null);
     }
   };
 
  const handleDeleteForMe = async () => {
     if (deletingMessage) {
       await deleteMessage(deletingMessage.id);
       setDeletingMessage(null);
     }
   };
 
  const handleDeleteForEveryone = async () => {
     if (deletingMessage) {
       // Same as delete for me for now - could add different logic
       await deleteMessage(deletingMessage.id);
       setDeletingMessage(null);
     }
   };
 
  const handleForward = (message: MessageWithSender) => {
     setForwardingMessage(message);
   };
 
  const handleNavigateToMessage = useCallback((messageId: string) => {
     const element = messageRefs.current.get(messageId);
     if (!element) {
       AppLog.warn('[ChatView]', 'Navigate-to-message: element not found for', messageId);
       return;
     }
     element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
     setHighlightedMessageId(messageId);
     clearTimeout(highlightTimerRef.current);
     highlightTimerRef.current = setTimeout(() => setHighlightedMessageId(null), 2000);
   }, []);
 
  // Check if message can be deleted for everyone (within 1 hour)
  const canDeleteForEveryone = useCallback((message: MessageWithSender) => {
     const messageTime = new Date(message.created_at).getTime();
     const now = Date.now();
     const oneHour = 60 * 60 * 1000;
     return now - messageTime < oneHour;
   }, []);
 
  const handleToggleReaction = useCallback((messageId: string) => (emoji: string) => {
    toggleReaction(messageId, emoji);
  }, [toggleReaction]);

  // Group messages by date
  const groupedMessages = useMemo(() => 
    groupMessagesByDate(messages),
    [messages]
  );

  // Determine which messages should show sender info
  const shouldShowSenderInfo = (message: MessageWithSender, index: number): boolean => {
    if (!isGroupChat) return false;
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    if (!prevMessage) return true;
    
    if (prevMessage.sender_id !== message.sender_id) return true;
    if (new Date(prevMessage.created_at).toDateString() !== new Date(message.created_at).toDateString()) return true;
    
    return false;
  };

  // Check if typing
  const isTyping = typingUsers.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0 pt-safe">
      {/* Header - Cleo glass style */}
      <header 
        className="flex-shrink-0 px-[18px] flex items-center gap-3"
        style={{
          height: 'calc(52px + max(env(safe-area-inset-top, 0px), 47px))',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          background: 'hsl(var(--background) / 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        {/* Back button */}
        <button 
          onClick={onBack}
          className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/60" />
        </button>
        
        {/* Avatar + Info */}
        <button 
          onClick={() => isGroupChat && setShowGroupInfo(true)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <SquircleAvatar
              src={headerInfo.avatarUrl}
              alt={headerInfo.name}
              size={40}
              fallback={headerInfo.initials}
              hideRing
            />
            {/* Online indicator for DMs */}
            {!isGroupChat && otherUserPresence?.status === 'online' && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
           <h2 className="text-[16px] font-semibold truncate text-foreground font-dm-sans">
              {headerInfo.name}
            </h2>
            <p className="text-[11px] truncate text-muted-foreground">
              {isTyping ? (
                <span className="text-[hsl(35,80%,43%)]">typing...</span>
              ) : 
               isGroupChat && conversation ? `${conversation.participants.length} members` :
               otherUserPresence?.status === 'online' ? (
                <span className="text-emerald-500">online</span>
              ) : 
               otherUserPresence?.status === 'away' ? 'away' : 
               otherUserPresence?.last_seen_at 
                 ? `last seen ${formatRelativeTime(otherUserPresence.last_seen_at)}`
                 : 'offline'}
            </p>
          </div>
        </button>
        
        {/* Kebab Menu */}
        {conversation && user && (
          <ChatHeaderMenu
            conversation={conversation}
            isGroupChat={isGroupChat}
            currentUserId={user.id}
            otherUserId={otherUser?.user_id || undefined}
            onOpenGroupInfo={() => setShowGroupInfo(true)}
             onSearchInChat={() => setShowSearchBar(true)}
             onViewSharedMedia={() => setShowSharedMedia(true)}
             otherUserName={otherUserName}
            onBack={onBack}
          />
        )}
      </header>

      {/* Messages - scrollable area */}
      {loading ? (
        <ChatSkeleton />
      ) : (
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
          onScroll={handleScroll}
        >
          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center mb-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="mx-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-muted/60 text-muted-foreground text-[12px] font-medium active:bg-muted transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Load earlier messages'
                )}
              </button>
            </div>
          )}

          {/* Messages grouped by date */}
          <div className="max-w-[800px] mx-auto">
            {Array.from(groupedMessages.entries()).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                <DateSeparator date={dateMessages[0].created_at} />
                
                {dateMessages.map((message, index) => {
                  const globalIndex = messages.indexOf(message);
                  const isOwn = message.sender_id === user?.id;
                  const showSender = shouldShowSenderInfo(message, globalIndex);
                  const replyTo = message.reply_to_id 
                    ? messagesMap.get(message.reply_to_id) 
                    : null;
                  const messageReactions = reactions[message.id] || [];

                  const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                  const isConsecutiveSameSender = prevMessage?.sender_id === message.sender_id;

                  return (
                    <div
                      key={message.id}
                      className={isConsecutiveSameSender ? 'mt-1' : 'mt-3'}
                    >
                      <MessageBubble
                        message={message}
                        isOwnMessage={isOwn}
                        showSenderInfo={showSender}
                        replyToMessage={replyTo}
                        reactions={messageReactions}
                        currentUserId={user?.id}
                        onReply={() => handleReply(message)}
                        onEdit={() => handleEdit(message)}
                        onDelete={() => handleDelete(message)}
                        onToggleReaction={handleToggleReaction(message.id)}
                        onForward={() => handleForward(message)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <TypingIndicator typingUsers={typingUsers} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom FAB */}
          {showScrollToBottom && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-28 w-9 h-9 rounded-full flex items-center justify-center z-20 active:scale-[0.97] transition-transform border border-border"
              style={{ right: 'calc(max(16px, (100vw - 480px) / 2 + 16px))', background: 'hsl(var(--background) / 0.9)' }}
            >
              <ChevronDown className="w-[18px] h-[18px] text-foreground/60" />
              {unreadBelowCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[hsl(38,92%,50%)] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadBelowCount > 99 ? '99+' : unreadBelowCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Input - WhatsApp style */}
      <MessageInput
        onSend={handleSend}
        onSendVoiceNote={handleSendVoiceNote}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onTyping={setTyping}
        disabled={loading}
      />

      {/* Group Info Page */}
      {showGroupInfo && conversation && isGroupChat && user && (
        <GroupInfoPage
          conversation={conversation}
          currentUserId={user.id}
          onClose={() => setShowGroupInfo(false)}
          onUpdate={() => fetchConversations()}
        />
      )}

      {/* Search Bar */}
      {showSearchBar && (
        <ChatSearchBar
          messages={messages}
          onClose={() => setShowSearchBar(false)}
          onNavigateToMessage={handleNavigateToMessage}
        />
      )}

      {/* Shared Media Gallery */}
      {showSharedMedia && (
        <SharedMediaGallery
          conversationId={conversationId}
          onClose={() => setShowSharedMedia(false)}
        />
      )}

      {/* Edit Message Modal */}
      <EditMessageModal
        open={!!editingMessage}
        onOpenChange={(open) => !open && setEditingMessage(null)}
        originalContent={editingMessage?.content || ''}
        onSave={handleSaveEdit}
      />

      {/* Delete Message Sheet */}
      <DeleteMessageSheet
        open={!!deletingMessage}
        onOpenChange={(open) => !open && setDeletingMessage(null)}
        isOwnMessage={deletingMessage?.sender_id === user?.id}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
        canDeleteForEveryone={deletingMessage ? canDeleteForEveryone(deletingMessage) : false}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        open={!!forwardingMessage}
        onOpenChange={(open) => !open && setForwardingMessage(null)}
        messageContent={forwardingMessage?.content || ''}
        messageType={forwardingMessage?.message_type}
        mediaUrl={forwardingMessage?.media_url || undefined}
        mediaMetadata={forwardingMessage?.media_metadata as Record<string, unknown> | undefined}
      />
    </div>
  );
}
