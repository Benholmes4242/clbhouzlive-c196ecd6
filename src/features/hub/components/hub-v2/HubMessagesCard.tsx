/**
 * HubMessagesCard - Messages section of Hub 2.0
 * Phase 2: Stacked avatars, online status, pulsing badges
 */

import { useMemo, useEffect } from 'react';
import { ChevronRight, MessageCircle } from 'lucide-react';
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

interface HubMessagesCardProps {
  conversations: any[];
  userId: string | undefined;
  cardStyle: React.CSSProperties;
}

// ============ Stacked Avatars Component ============

function StackedAvatars({ 
  participants, 
  size = 40,
  maxVisible = 3 
}: { 
  participants: ParticipantPreview[];
  size?: number;
  maxVisible?: number;
}) {
  const visible = participants.slice(0, maxVisible);
  const overflow = participants.length - maxVisible;
  const avatarSize = size * 0.75;
  const offset = avatarSize * 0.55;
  
  return (
    <div 
      className="relative flex items-center"
      style={{ 
        width: avatarSize + (visible.length - 1) * offset + (overflow > 0 ? offset : 0),
        height: avatarSize,
      }}
    >
      {visible.map((p, index) => (
        <div
          key={p.id}
          className="absolute rounded-full border-2 border-white"
          style={{
            left: index * offset,
            zIndex: maxVisible - index,
            width: avatarSize,
            height: avatarSize,
          }}
        >
          <SquircleAvatar
            size={avatarSize - 4}
            src={p.avatarUrl}
            alt={p.displayName}
            fallback={p.displayName.charAt(0).toUpperCase()}
            hideRing
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="absolute rounded-full border-2 border-white bg-muted flex items-center justify-center"
          style={{
            left: visible.length * offset,
            zIndex: 0,
            width: avatarSize,
            height: avatarSize,
          }}
        >
          <span className="text-meta font-semibold text-muted-foreground">
            +{overflow}
          </span>
        </div>
      )}
    </div>
  );
}

// ============ Online Status Dot ============

function OnlineDot({ 
  status, 
  size = 'sm' 
}: { 
  status: PresenceStatus; 
  size?: 'sm' | 'md';
}) {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  };
  
  if (status !== 'online') return null;
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-green-500 border-2 border-white`}
      style={{ boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.3)' }}
    />
  );
}

// ============ Pulsing Unread Badge ============

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  
  return (
    <motion.span
      className="min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-meta font-semibold flex items-center justify-center"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{
        duration: 0.4,
        repeat: Infinity,
        repeatDelay: 2.6,
        ease: 'easeInOut',
      }}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

// ============ Main Component ============

export function HubMessagesCard({ conversations, userId, cardStyle }: HubMessagesCardProps) {
  const navigate = useNavigate();
  const { presenceMap, subscribeToPresence } = usePresence();
  
  const unreadCount = useMemo(() => {
    return conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
  }, [conversations]);
  
  const conversationPreviews: ConversationPreview[] = useMemo(() => {
    if (!conversations?.length || !userId) return [];
    
    return conversations.slice(0, 3).map(conv => {
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
    <div className="rounded-2xl overflow-hidden" style={cardStyle}>
      {/* Header */}
      <button
        onClick={handleOpenMessages}
        className="w-full flex items-center justify-between p-4 pb-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(217_91%_60%/0.12)] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[hsl(217_91%_60%)]" />
          </div>
          <span className="text-body-lg font-semibold text-foreground">Messages</span>
          <UnreadBadge count={unreadCount} />
        </div>
        <ChevronRight className="w-5 h-5 text-tertiary" />
      </button>
      
      {/* Conversation Previews */}
      {conversationPreviews.length > 0 ? (
        <div className="px-4 pb-3 space-y-1">
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
                className="w-full flex items-center gap-3 p-2.5 -mx-2 rounded-xl hover:bg-black/5 active:bg-black/10 transition-colors"
              >
                {/* Avatar Section */}
                <div className="relative flex-shrink-0">
                  {conv.isGroup && conv.participants && conv.participants.length > 1 ? (
                    <StackedAvatars 
                      participants={conv.participants} 
                      size={44}
                      maxVisible={3}
                    />
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
                          <OnlineDot status={presenceStatus} size="sm" />
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-body-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                        {conv.name}
                      </span>
                      {conv.isGroup && conv.participantCount && conv.participantCount > 2 && (
                        <span className="text-meta text-tertiary flex-shrink-0">
                          · {conv.participantCount}
                        </span>
                      )}
                    </div>
                    <span className="text-meta text-tertiary flex-shrink-0">
                      {conv.timestamp}
                    </span>
                  </div>
                  <p className={`text-body-sm truncate ${conv.unreadCount > 0 ? 'text-foreground' : 'text-secondary'}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                
                {/* Unread dot */}
                {conv.unreadCount > 0 && (
                  <motion.div 
                    className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-4 pb-4 text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-body-sm text-secondary">Connect with fellow golfers</p>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={handleNewChat}
          className="flex-1 py-2.5 px-3 rounded-full text-body-sm font-medium text-[hsl(217_91%_60%)] bg-[hsl(217_91%_60%/0.1)] hover:bg-[hsl(217_91%_60%/0.15)] active:bg-[hsl(217_91%_60%/0.2)] transition-colors"
        >
          New Chat
        </button>
        <button
          onClick={handleNewGroup}
          className="flex-1 py-2.5 px-3 rounded-full text-body-sm font-medium text-[hsl(217_91%_60%)] bg-[hsl(217_91%_60%/0.1)] hover:bg-[hsl(217_91%_60%/0.15)] active:bg-[hsl(217_91%_60%/0.2)] transition-colors"
        >
          New Group
        </button>
      </div>
    </div>
  );
}
