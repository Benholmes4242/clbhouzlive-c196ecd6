/**
 * HubMessagesCardPolished - WhatsApp-Style Messages Card
 * White bubble, minimal chrome, content-focused
 */

import { useMemo, useEffect } from 'react';
import { ChevronRight, MessageCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePresence, type PresenceStatus } from '@/hooks/usePresence';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// ============ Types ============

interface ParticipantPreview {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

interface ConversationPreview {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  participantCount?: number;
  participants?: ParticipantPreview[];
  otherUserId?: string;
}

interface HubMessagesCardPolishedProps {
  conversations: any[];
  userId: string | undefined;
  unreadCount: number;
  className?: string;
}

// ============ Online Status Dot ============

function OnlineDot({ status }: { status: PresenceStatus }) {
  if (status !== 'online') return null;
  
  return (
    <div className="w-3 h-3 rounded-full border-2 border-white bg-green-500" />
  );
}

// ============ Main Component ============

export function HubMessagesCardPolished({ conversations, userId, unreadCount, className }: HubMessagesCardPolishedProps) {
  const navigate = useNavigate();
  const { presenceMap, subscribeToPresence } = usePresence();
  
  const conversationPreviews: ConversationPreview[] = useMemo(() => {
    if (!conversations?.length || !userId) return [];
    
    // Show up to 2 recent conversations
    return conversations.slice(0, 2).map(conv => {
      const otherParticipants = conv.participants?.filter((p: any) => p.user_id !== userId) || [];
      const isGroup = conv.type === 'group';
      const firstOther = otherParticipants[0];
      
      const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      };
      
      const participantPreviews: ParticipantPreview[] = otherParticipants.map((p: any) => ({
        id: p.user_id || '',
        displayName: p.profile?.display_name || p.profile?.username || 'Unknown',
        avatarUrl: p.profile?.profile_photo_url || undefined,
      }));
      
      return {
        id: conv.id,
        name: isGroup 
          ? conv.name || 'Group Chat' 
          : firstOther?.profile?.display_name || firstOther?.profile?.username || 'Unknown',
        avatarUrl: isGroup 
          ? conv.avatar_url || undefined 
          : firstOther?.profile?.profile_photo_url || undefined,
        lastMessage: conv.last_message_preview || 'No messages yet',
        timestamp: formatTime(conv.last_message_at),
        unreadCount: conv.unread_count || 0,
        isGroup,
        participantCount: conv.participants?.length,
        participants: participantPreviews,
        otherUserId: !isGroup && firstOther ? firstOther.user_id || undefined : undefined,
      };
    });
  }, [conversations, userId]);
  
  useEffect(() => {
    const dmUserIds = conversationPreviews
      .filter(c => !c.isGroup && c.otherUserId)
      .map(c => c.otherUserId as string);
    
    if (dmUserIds.length > 0) {
      subscribeToPresence(dmUserIds);
    }
  }, [conversationPreviews, subscribeToPresence]);

  const handleOpenMessages = () => {
    haptic('light');
    navigate('/messages');
  };
  
  const handleNewChat = () => {
    haptic('light');
    navigate('/messages?new=dm');
  };
  
  const handleNewGroup = () => {
    haptic('light');
    navigate('/messages?new=group');
  };

  return (
    <div className={`bg-white rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col ${className || ''}`}>
      {/* Header row - fixed height */}
      <div className="flex-none flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          <span className="text-[17px] font-semibold text-[#1D1D1F]">Messages</span>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-red-500 text-white text-[11px] font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
      </div>

      {/* Conversation preview - scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
      {conversationPreviews.length > 0 ? (
        conversationPreviews.map((conv) => {
          const presenceStatus = conv.otherUserId 
            ? presenceMap.get(conv.otherUserId)?.status 
            : undefined;
          
          return (
            <button
              key={conv.id}
              onClick={() => {
                haptic('light');
                navigate(`/messages/${conv.id}`);
              }}
              className="w-full px-4 py-3 flex items-center gap-3 active:bg-[#F5F5F5] transition-colors"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {conv.isGroup ? (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <>
                    <SquircleAvatar
                      size={48}
                      src={conv.avatarUrl}
                      alt={conv.name}
                      fallback={conv.name.charAt(0).toUpperCase()}
                      hideRing
                    />
                    {presenceStatus && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <OnlineDot status={presenceStatus} />
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[16px] font-semibold text-[#1D1D1F] truncate">
                    {conv.name}
                  </span>
                  <span className="text-[13px] text-[#8E8E93] flex-shrink-0">
                    {conv.timestamp}
                  </span>
                </div>
                <p className="text-[15px] text-[#8E8E93] truncate">
                  {conv.lastMessage}
                </p>
              </div>
            </button>
          );
        })
      ) : (
        <button
          onClick={handleOpenMessages}
          className="w-full px-4 py-3 flex items-center gap-3 active:bg-[#F5F5F5] transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-[#F0F0F5] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#8E8E93]" />
          </div>
          <span className="text-[15px] text-[#8E8E93]">
            No conversations yet
          </span>
        </button>
      )}
      </div>

      {/* Divider */}
      <div className="flex-none h-px bg-[#E5E5EA] mx-4" />

      {/* Action buttons - fixed at bottom */}
      <div className="flex-none flex gap-2 p-4">
        <button
          onClick={handleNewChat}
          className="flex-1 h-11 bg-[#25D366] text-white rounded-full text-[15px] font-semibold active:opacity-90 transition-opacity"
        >
          New Chat
        </button>
        <button
          onClick={handleNewGroup}
          className="flex-1 h-11 bg-[#F0F0F5] text-[#1D1D1F] rounded-full text-[15px] font-semibold active:opacity-90 transition-opacity"
        >
          New Group
        </button>
      </div>
    </div>
  );
}
