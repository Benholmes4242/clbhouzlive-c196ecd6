/**
 * HubMessagesCardPolished - Liquid Glass Messages Card
 * Fixed viewport, 2 conversation max, blue accent
 */

import { useMemo, useEffect } from 'react';
import { ChevronRight, MessageCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
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
}

// ============ Online Status Dot ============

function OnlineDot({ status }: { status: PresenceStatus }) {
  if (status !== 'online') return null;
  
  return (
    <div className="w-3 h-3 rounded-full border-2 border-white bg-green-500" />
  );
}

// ============ Unread Badge (Red Pill) ============

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  
  return (
    <span className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-red-500 text-white text-[11px] font-bold">
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ============ Main Component ============

export function HubMessagesCardPolished({ conversations, userId, unreadCount }: HubMessagesCardPolishedProps) {
  const navigate = useNavigate();
  const { presenceMap, subscribeToPresence } = usePresence();
  
  const conversationPreviews: ConversationPreview[] = useMemo(() => {
    if (!conversations?.length || !userId) return [];
    
    // Only show 2 conversations max to fit without scroll
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
    <div className="flex flex-col rounded-[24px] bg-[#F0F7FF] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Card Header */}
      <button
        onClick={handleOpenMessages}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          {/* Blue icon container */}
          <div className="w-11 h-11 rounded-2xl bg-[#007AFF] flex items-center justify-center shadow-sm">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-[18px] font-semibold text-[#1D1D1F]">
            Messages
          </span>
          <UnreadBadge count={unreadCount} />
        </div>
        <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
      </button>
      
      {/* Conversation preview */}
      {conversationPreviews.length > 0 ? (
        <div className="space-y-3 mb-4">
          {conversationPreviews.map((conv) => {
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
                className="w-full bg-white/80 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
              >
                {/* Avatar Section */}
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
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`truncate text-[16px] text-[#1D1D1F] ${conv.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>
                      {conv.name}
                    </span>
                    <span className="text-[13px] text-[#AEAEB2] flex-shrink-0">
                      {conv.timestamp}
                    </span>
                  </div>
                  <p className={`truncate text-[14px] ${conv.unreadCount > 0 ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                
                {/* Unread dot indicator */}
                {conv.unreadCount > 0 && (
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#007AFF]" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/80 rounded-2xl p-6 mb-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 mb-3 rounded-full flex items-center justify-center bg-[#F0F0F5]">
            <MessageCircle className="w-6 h-6 text-[#C7C7CC]" />
          </div>
          <p className="text-[15px] text-[#86868B]">
            Connect with fellow golfers
          </p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleNewChat}
          className="flex-1 h-[48px] bg-[#007AFF] text-white rounded-2xl text-[15px] font-semibold shadow-sm active:scale-[0.98] transition-transform"
        >
          New Chat
        </button>
        <button
          onClick={handleNewGroup}
          className="flex-1 h-[48px] bg-white text-[#1D1D1F] rounded-2xl text-[15px] font-semibold border border-[#E5E5EA] active:scale-[0.98] transition-transform"
        >
          New Group
        </button>
      </div>
    </div>
  );
}
