import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ConversationParticipant, ParticipantProfile, ParticipantWithProfile } from '@/types/messaging';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useMessaging } from '@/hooks/useMessaging';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { usePresence } from '@/hooks/usePresence';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Loader2, Phone, MoreVertical } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { OnlineIndicator } from './OnlineIndicator';
import { GroupInfoPage } from './GroupInfoPage';
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
    <div className="flex-1 p-4 space-y-4">
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
    <div className="flex justify-center py-3">
      <span className="px-4 py-1.5 bg-white rounded-full text-[12px] font-medium text-[#8E8E93] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        {formatDateHeader(date)}
      </span>
    </div>
  );
}

export function ChatView({ conversationId, onBack }: ChatViewProps) {
  const { user } = useSupabaseSession();
  const { conversations, markAsRead, fetchConversations } = useMessaging();
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
            console.error('[ChatView] Error fetching conversation:', convError);
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
          console.error('[ChatView] Error fetching direct conversation:', err);
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

  // Create a map for quick reply-to lookup
  const messagesMap = useMemo(() => {
    const map = new Map<string, MessageWithSender>();
    messages.forEach(m => map.set(m.id, m));
    return map;
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      console.error('Error sending voice note:', error);
    }
  }, [user, sendMessage]);

  const handleReply = (message: MessageWithSender) => {
    setReplyingTo(message);
  };

  const handleEdit = async (message: MessageWithSender) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      await editMessage(message.id, newContent);
    }
  };

  const handleDelete = async (message: MessageWithSender) => {
    if (confirm('Delete this message?')) {
      await deleteMessage(message.id);
    }
  };

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
    <div className="flex flex-col h-full min-h-0 pt-safe bg-[#F8FAFC]">
      {/* Header - WhatsApp style */}
      <header className="flex-shrink-0 h-[60px] bg-[#F8FAFC] px-4 flex items-center gap-3 border-b border-[#E5E5EA]">
        {/* Back button */}
        <button 
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#1D1D1F]" />
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
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] rounded-full border-2 border-[#F8FAFC]" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <h2 className="text-[17px] font-semibold text-[#1D1D1F] truncate">
              {headerInfo.name}
            </h2>
            <p className="text-[13px] text-[#8E8E93] truncate">
              {isTyping ? 'typing...' : 
               isGroupChat && conversation ? `${conversation.participants.length} members` :
               otherUserPresence?.status === 'online' ? 'online' : 
               otherUserPresence?.status === 'away' ? 'away' : 'last seen recently'}
            </p>
          </div>
        </button>
        
        {/* Actions */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors">
          <Phone className="w-5 h-5 text-[#1D1D1F]" />
        </button>
        <button className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors">
          <MoreVertical className="w-5 h-5 text-[#1D1D1F]" />
        </button>
      </header>

      {/* Messages - scrollable area */}
      {loading ? (
        <ChatSkeleton />
      ) : (
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
        >
          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center mb-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 bg-white rounded-full text-[13px] font-medium text-[#8E8E93] shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:bg-[#F5F5F5] transition-colors disabled:opacity-50"
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
          <div className="max-w-[800px] mx-auto space-y-1">
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

                  return (
                    <MessageBubble
                      key={message.id}
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
                    />
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
    </div>
  );
}
