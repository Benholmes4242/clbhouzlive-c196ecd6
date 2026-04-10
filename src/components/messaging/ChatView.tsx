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
import { ChevronLeft, Loader2, ChevronDown, MoreVertical, Users, MapPin } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
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

  if (date.toDateString() === today.toDateString()) return 'TODAY';
  if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
  
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  }
  
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  }).toUpperCase();
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
    <div className="flex justify-center" style={{ padding: '8px 0 4px' }}>
      <span
        style={{
          fontSize: '10.5px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#94a3b8',
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 99,
          padding: '3px 12px',
          textTransform: 'uppercase',
        }}
      >
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
    deleteMessageForMe,
  } = useConversationMessages(conversationId);

  const { typingUsers, setTyping, clearTyping } = useTypingIndicator(conversationId);
  const { reactions, toggleReaction } = useMessageReactions(conversationId);
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
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();

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

          const rawParticipants = convData.conversation_participants as ConversationParticipant[] | null;
          const participantIds = (rawParticipants || [])
            .map(p => p.user_id)
            .filter((id): id is string => id !== null);

          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url, eg_handicap_index, home_club')
            .in('id', participantIds);

          const profilesMap = new Map<string, ParticipantProfile>();
          profiles?.forEach(profile => {
            if (profile.id) {
              profilesMap.set(profile.id, {
                id: profile.id,
                username: profile.username,
                display_name: profile.display_name,
                profile_photo_url: profile.profile_photo_url,
                eg_handicap_index: profile.eg_handicap_index ?? null,
                home_club: profile.home_club ?? null,
              });
            }
          });

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

  const conversation = contextConversation || directConversation;

  const otherUser = useMemo(() => {
    if (!conversation || !user || conversation.type !== 'direct') return null;
    return conversation.participants.find(p => p.user_id !== user.id);
  }, [conversation, user]);

  useEffect(() => {
    if (otherUser?.user_id) {
      subscribeToPresence([otherUser.user_id]);
    }
  }, [otherUser?.user_id, subscribeToPresence]);

  const otherUserPresence = otherUser?.user_id ? presenceMap.get(otherUser.user_id) : null;

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

  const isGroupChat = conversation?.type !== 'direct';

  const otherUserName = useMemo(() => {
    if (conversation?.type === 'direct') {
      const other = conversation.participants.find(p => p.user_id !== user?.id);
      return other?.profile?.display_name || other?.profile?.username || 'User';
    }
    return 'User';
  }, [conversation, user?.id]);

  const messagesMap = useMemo(() => {
    const map = new Map<string, MessageWithSender>();
    messages.forEach(m => map.set(m.id, m));
    return map;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
    if (isNearBottom) setUnreadBelowCount(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadBelowCount(0);
  }, []);

  useEffect(() => {
    return () => clearTimeout(highlightTimerRef.current);
  }, []);

  useEffect(() => {
    if (conversationId) markAsRead(conversationId);
  }, [conversationId, markAsRead]);

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
    import('@/utils/analyticsEvents').then(({ analyticsEvents }) => {
      analyticsEvents.track('message_sent', { is_voice_note: finalMessageType === 'voice' });
    });
  }, [sendMessage, clearTyping]);

  const handleSendVoiceNote = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!user) return;
    try {
      const fileName = `voice-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
      const filePath = `${user.id}/voice-notes/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('message-media')
        .upload(filePath, audioBlob, { contentType: 'audio/webm' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('message-media')
        .getPublicUrl(filePath);
      await sendMessage('🎤 Voice message', null, publicUrl, 'voice', { duration });
    } catch (error) {
      AppLog.error('[ChatView]', 'Error sending voice note:', error);
    }
  }, [user, sendMessage]);

  const handleReply = (message: MessageWithSender) => setReplyingTo(message);
  const handleEdit = (message: MessageWithSender) => setEditingMessage(message);
  const handleDelete = (message: MessageWithSender) => setDeletingMessage(message);

  const handleSaveEdit = async (newContent: string) => {
    if (editingMessage) {
      await editMessage(editingMessage.id, newContent);
      setEditingMessage(null);
    }
  };

  const handleDeleteForMe = async () => {
    if (deletingMessage) {
      await deleteMessageForMe(deletingMessage.id);
      setDeletingMessage(null);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (deletingMessage) {
      await deleteMessage(deletingMessage.id);  // sets deleted_at for all participants
      setDeletingMessage(null);
    }
  };

  const handleForward = (message: MessageWithSender) => setForwardingMessage(message);

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

  const canDeleteForEveryone = useCallback((message: MessageWithSender) => {
    const messageTime = new Date(message.created_at).getTime();
    return Date.now() - messageTime < 60 * 60 * 1000;
  }, []);

  const handleToggleReaction = useCallback((messageId: string) => (emoji: string) => {
    toggleReaction(messageId, emoji);
  }, [toggleReaction]);

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  const shouldShowSenderInfo = (message: MessageWithSender, index: number): boolean => {
    if (!isGroupChat) return false;
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    if (!prevMessage) return true;
    if (prevMessage.sender_id !== message.sender_id) return true;
    if (new Date(prevMessage.created_at).toDateString() !== new Date(message.created_at).toDateString()) return true;
    return false;
  };

  const isTyping = typingUsers.length > 0;

  // Count online members for group header
  const onlineCount = useMemo(() => {
    if (!isGroupChat || !conversation) return 0;
    return conversation.participants.filter(p => {
      if (p.user_id === user?.id) return true; // current user is online
      return p.user_id ? presenceMap.get(p.user_id)?.status === 'online' : false;
    }).length;
  }, [isGroupChat, conversation, presenceMap, user?.id]);

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#F8FAFC' }}>
      {/* Header */}
      <header 
        className="flex-shrink-0 flex items-center"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          background: '#F8FAFC',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          gap: 10,
        }}
      >
        {/* Back button — 34×34 */}
        <button 
          onClick={onBack}
          className="flex items-center justify-center active:scale-[0.97] transition-transform flex-shrink-0"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,0.06)', border: 'none',
          }}
        >
          <ChevronLeft style={{ color: '#475569' }} strokeWidth={2.5} className="w-5 h-5" />
        </button>
        
        {/* Avatar + Info */}
        <button 
          onClick={() => isGroupChat && setShowGroupInfo(true)}
          className="flex items-center flex-1 min-w-0"
          style={{ gap: 10, background: 'none', border: 'none', textAlign: 'left' as const, cursor: isGroupChat ? 'pointer' : 'default' }}
        >
          <div className="relative flex-shrink-0">
            {isGroupChat && !headerInfo.avatarUrl ? (
              <div
                className="flex items-center justify-center"
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F7931E, #e07a0d)',
                }}
              >
                <Users className="w-[18px] h-[18px] text-white" />
              </div>
            ) : (
              <SquircleAvatar
                src={headerInfo.avatarUrl}
                alt={headerInfo.name}
                size={38}
                fallback={headerInfo.initials}
                hideRing
              />
            )}
            {/* Online dot for DMs */}
            {!isGroupChat && otherUserPresence?.status === 'online' && (
              <div
                className="absolute"
                style={{
                  bottom: 0, right: 0,
                  width: 9, height: 9, borderRadius: '50%',
                  background: '#22c55e',
                  border: '2.5px solid #F8FAFC',
                }}
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Row 1: Name */}
            <div className="flex items-center" style={{ gap: 6 }}>
              <span
                className="truncate"
                style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}
              >
                {headerInfo.name}
              </span>
            </div>
            {/* Row 2: Status */}
            <div className="flex items-center" style={{ gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 500 }}>
                {isTyping ? (
                  <span style={{ color: '#F7931E' }}>typing...</span>
                ) : isGroupChat && conversation ? (
                  <>
                    <span style={{ color: '#22c55e' }}>{onlineCount} online</span>
                    <span style={{ color: '#94a3b8' }}> · {conversation.participants.length} members</span>
                  </>
                ) : otherUserPresence?.status === 'online' ? (
                  <span style={{ color: '#22c55e' }}>online</span>
                ) : otherUserPresence?.status === 'away' ? (
                  <span style={{ color: '#94a3b8' }}>away</span>
                ) : otherUserPresence?.last_seen_at ? (
                  <span style={{ color: '#94a3b8' }}>last seen {formatRelativeTime(otherUserPresence.last_seen_at)}</span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>offline</span>
                )}
              </span>
              {!isGroupChat && otherUser?.profile?.eg_handicap_index != null && (
                <span style={{
                  fontSize: '10.5px', fontWeight: 600, color: '#F7931E',
                  background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.25)',
                  borderRadius: 99, padding: '1px 7px',
                }}>
                  HCP {otherUser.profile.eg_handicap_index}
                </span>
              )}
              {!isGroupChat && otherUser?.profile?.home_club && (
                <span className="flex items-center" style={{
                  gap: 3, fontSize: '10.5px', fontWeight: 600, color: '#006747',
                  background: 'rgba(0,103,71,0.07)', border: '1px solid rgba(0,103,71,0.18)',
                  borderRadius: 99, padding: '1px 7px',
                }}>
                  <MapPin size={9} />
                  {otherUser.profile.home_club}
                </span>
              )}
            </div>
          </div>
        </button>
        
        {/* Kebab Menu — 34×34 */}
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

      {/* Messages */}
      {loading ? (
        <ChatSkeleton />
      ) : (
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ padding: '8px 14px 12px', background: '#F8FAFC' }}
          onScroll={handleScroll}
        >
          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center" style={{ marginBottom: 16 }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center justify-center active:scale-[0.97] transition-transform disabled:opacity-50"
                style={{
                  padding: '6px 16px', borderRadius: 99,
                  background: 'rgba(0,0,0,0.05)',
                  fontSize: 12, color: '#64748b', fontWeight: 500,
                  border: 'none', cursor: 'pointer',
                }}
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
                      ref={(el) => { if (el) messageRefs.current.set(message.id, el); }}
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
                        isHighlighted={highlightedMessageId === message.id}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {typingUsers.length > 0 && (
              <TypingIndicator typingUsers={typingUsers} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom FAB */}
          {showScrollToBottom && (
            <button
              onClick={scrollToBottom}
              className="fixed flex items-center justify-center z-20 active:scale-[0.97] transition-transform"
              style={{
                bottom: 72, right: 16,
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              }}
            >
              <ChevronDown style={{ color: '#64748b' }} size={14} />
              {unreadBelowCount > 0 && (
                <span
                  className="absolute flex items-center justify-center"
                  style={{
                    top: -4, right: -4,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#F7931E', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                  }}
                >
                  {unreadBelowCount > 99 ? '99+' : unreadBelowCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Input */}
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
