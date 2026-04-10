/**
 * ForwardMessageModal - Select a conversation to forward a message to
 */

import { useState, useMemo } from 'react';
import { Search, MessageCircle, Users, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';
import { AppLog } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { ConversationWithDetails, MessageType } from '@/types/messaging';

interface ForwardMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageContent: string;
  messageType?: string;
  mediaUrl?: string;
  mediaMetadata?: Record<string, unknown>;
}

export function ForwardMessageModal({
  open,
  onOpenChange,
  messageContent,
  messageType = 'text',
  mediaUrl,
  mediaMetadata,
}: ForwardMessageModalProps) {
  const { user } = useSupabaseSession();
  const { conversations, sendMessage } = useMessagingContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [forwarding, setForwarding] = useState<string | null>(null);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      if (conv.type === 'direct') {
        const other = conv.participants.find(p => p.user_id !== user?.id);
        const name = other?.profile?.display_name || other?.profile?.username || '';
        return name.toLowerCase().includes(query);
      }
      return conv.name?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, user?.id]);

  const getConversationDisplay = (conv: ConversationWithDetails) => {
    if (conv.type === 'direct') {
      const other = conv.participants.find(p => p.user_id !== user?.id);
      return {
        name: other?.profile?.display_name || other?.profile?.username || 'Unknown',
        avatarUrl: other?.profile?.profile_photo_url,
        isGroup: false,
      };
    }
    return {
      name: conv.name || 'Group Chat',
      avatarUrl: conv.avatar_url,
      isGroup: true,
    };
  };

  const handleForward = async (conversationId: string) => {
    haptic('light');
    setForwarding(conversationId);

    try {
      const isMedia = ['image', 'video', 'voice'].includes(messageType);
      const content = isMedia ? messageContent || '' : `↪️ Forwarded:\n${messageContent}`;

      await sendMessage(
        conversationId,
        content,
        isMedia ? messageType as MessageType : 'text',
        isMedia ? (mediaUrl || null) : null,
        isMedia ? (mediaMetadata || null) : null,
        null
      );

      toast.success('Message forwarded');
      onOpenChange(false);
    } catch (error) {
      AppLog.error('[ForwardMessageModal]', 'Error forwarding message:', error);
      toast.error('Failed to forward message');
    } finally {
      setForwarding(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-0 pb-8"
        style={{ height: 'min(70vh, calc(100dvh - 120px))' }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e2e8f0', margin: '12px auto' }} />
        <SheetHeader className="px-4 pb-4">
          <SheetTitle className="text-center text-[17px] font-semibold">
            Forward Message
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10 h-10 rounded-full bg-[rgba(247,147,30,0.05)] border border-border"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mb-2 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const display = getConversationDisplay(conv);
              const isForwarding = forwarding === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleForward(conv.id)}
                  disabled={forwarding !== null}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 transition-colors active:scale-[0.97]",
                    "hover:bg-[rgba(247,147,30,0.05)] active:bg-[rgba(247,147,30,0.10)]",
                    forwarding !== null && forwarding !== conv.id && "opacity-50"
                  )}
                >
                  {display.isGroup ? (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F7931E, #e07a0d)' }}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <SquircleAvatar
                      size={48}
                      src={display.avatarUrl}
                      alt={display.name}
                      fallback={display.name.charAt(0).toUpperCase()}
                      hideRing
                    />
                  )}
                  <span className="flex-1 text-left font-medium text-foreground truncate">
                    {display.name}
                  </span>
                  {isForwarding && (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#F7931E' }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
