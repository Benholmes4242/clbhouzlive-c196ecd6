/**
 * HubMessagesCardPolished - Apple-grade Messages Card
 * Fixed viewport, 2 conversation max, tactile feedback
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

// ============ System Font Stack ============
const systemFontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

// ============ Online Status Dot ============

function OnlineDot({ status }: { status: PresenceStatus }) {
  if (status !== 'online') return null;
  
  return (
    <div 
      className="w-3 h-3 rounded-full border-2 border-white"
      style={{ 
        backgroundColor: 'hsl(142 71% 45%)', // green-500
        boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.3)' 
      }}
    />
  );
}

// ============ Unread Badge (Red Pill) ============

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  
  return (
    <span
      className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: 'hsl(0 84% 60%)', // red-500
        color: 'white',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: systemFontStack,
      }}
    >
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
    <div 
      className="flex-1 flex flex-col rounded-[28px] overflow-hidden transition-all duration-200 active:scale-[0.98]"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        fontFamily: systemFontStack,
      }}
    >
      {/* Header */}
      <button
        onClick={handleOpenMessages}
        className="flex items-center justify-between px-5 pt-5 pb-3"
      >
        <div className="flex items-center gap-3">
          {/* Blue gradient icon container */}
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%)',
            }}
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span style={{ fontSize: '17px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Messages
          </span>
          <UnreadBadge count={unreadCount} />
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
      </button>
      
      {/* Conversation Previews - flex-1 to fill space */}
      <div className="flex-1 px-5 pb-3 flex flex-col justify-center">
        {conversationPreviews.length > 0 ? (
          <div className="space-y-2">
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
                  className="w-full flex items-center gap-3 p-2 -mx-2 rounded-2xl hover:bg-black/5 active:scale-[0.98] transition-all duration-200"
                >
                  {/* Avatar Section */}
                  <div className="relative flex-shrink-0">
                    {conv.isGroup ? (
                      // Group chat: purple gradient avatar with Users icon
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, hsl(271 91% 65%) 0%, hsl(280 84% 50%) 100%)',
                        }}
                      >
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <>
                        <SquircleAvatar
                          size={44}
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
                    <div className="flex items-center justify-between gap-2">
                      <span 
                        className="truncate"
                        style={{ 
                          fontSize: '15px', 
                          fontWeight: conv.unreadCount > 0 ? 600 : 500,
                          color: 'hsl(var(--foreground))',
                        }}
                      >
                        {conv.name}
                      </span>
                      <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                        {conv.timestamp}
                      </span>
                    </div>
                    <p 
                      className="truncate"
                      style={{ 
                        fontSize: '14px', 
                        color: conv.unreadCount > 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>
                  
                  {/* Unread indicator */}
                  {conv.unreadCount > 0 && (
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: 'hsl(217 91% 60%)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            >
              <MessageCircle className="w-6 h-6" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <p style={{ fontSize: '15px', color: 'hsl(var(--muted-foreground))' }}>
              Connect with fellow golfers
            </p>
          </div>
        )}
      </div>
      
      {/* Bottom Action Buttons */}
      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={handleNewChat}
          className="flex-1 py-2.5 px-3 rounded-full transition-all duration-200 active:scale-[0.98]"
          style={{
            fontSize: '15px',
            fontWeight: 500,
            background: 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%)',
            color: 'white',
          }}
        >
          New Chat
        </button>
        <button
          onClick={handleNewGroup}
          className="flex-1 py-2.5 px-3 rounded-full transition-all duration-200 active:scale-[0.98]"
          style={{
            fontSize: '15px',
            fontWeight: 500,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            color: 'hsl(var(--foreground))',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          New Group
        </button>
      </div>
    </div>
  );
}
