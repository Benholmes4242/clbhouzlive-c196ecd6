/**
 * HubMessagesCardDark - Dark-mode Liquid Glass Messages Card
 * Fixed viewport, 2 conversation max, no scroll
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

interface HubMessagesCardDarkProps {
  conversations: any[];
  userId: string | undefined;
  unreadCount: number;
  className?: string;
}

// ============ System Font Stack ============
const systemFontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

// ============ Online Status Dot ============

function OnlineDot({ status }: { status: PresenceStatus }) {
  if (status !== 'online') return null;
  
  return (
    <div 
      className="w-3 h-3 rounded-full"
      style={{ 
        backgroundColor: 'hsl(142 71% 45%)',
        border: '2px solid hsl(222 47% 11%)',
        boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.4)' 
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
        backgroundColor: 'hsl(0 84% 60%)',
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

export function HubMessagesCardDark({ conversations, userId, unreadCount, className }: HubMessagesCardDarkProps) {
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
      className={`flex flex-col rounded-[28px] overflow-hidden ${className || ''}`}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        fontFamily: systemFontStack,
      }}
    >
      {/* Header - flex-none */}
      <motion.button
        onClick={handleOpenMessages}
        whileTap={{ scale: 0.98 }}
        className="flex-none flex items-center justify-between px-4 pt-4 pb-2"
      >
        <div className="flex items-center gap-3">
          {/* Blue glass icon container */}
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span style={{ fontSize: '17px', fontWeight: 600, color: 'white' }}>
            Messages
          </span>
          <UnreadBadge count={unreadCount} />
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
      </motion.button>
      
      {/* Conversation Previews - flex-1 min-h-0 overflow-hidden */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-2 flex flex-col justify-center">
        {conversationPreviews.length > 0 ? (
          <div className="space-y-2">
            {conversationPreviews.map((conv) => {
              const presenceStatus = conv.otherUserId 
                ? presenceMap.get(conv.otherUserId)?.status 
                : undefined;
              
              return (
                <motion.button
                  key={conv.id}
                  onClick={() => {
                    haptic('light');
                    navigate(`/messages/${conv.id}`);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl transition-colors duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {/* Avatar Section */}
                  <div className="relative flex-shrink-0">
                    {conv.isGroup ? (
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
                  
                  {/* Content - truncated */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span 
                        className="truncate"
                        style={{ 
                          fontSize: '15px', 
                          fontWeight: conv.unreadCount > 0 ? 600 : 500,
                          color: 'white',
                        }}
                      >
                        {conv.name}
                      </span>
                      <span 
                        className="flex-shrink-0"
                        style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {conv.timestamp}
                      </span>
                    </div>
                    <p 
                      className="truncate"
                      style={{ 
                        fontSize: '14px', 
                        color: conv.unreadCount > 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
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
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <MessageCircle className="w-6 h-6" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            </div>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)' }}>
              Connect with fellow golfers
            </p>
          </div>
        )}
      </div>
      
      {/* Bottom Action Buttons - flex-none */}
      <div className="flex-none px-4 pb-4 pt-2 flex gap-2">
        <motion.button
          onClick={handleNewChat}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-2.5 px-3 rounded-full"
          style={{
            fontSize: '15px',
            fontWeight: 500,
            background: 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
        >
          New Chat
        </motion.button>
        <motion.button
          onClick={handleNewGroup}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-2.5 px-3 rounded-full"
          style={{
            fontSize: '15px',
            fontWeight: 500,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          New Group
        </motion.button>
      </div>
    </div>
  );
}
