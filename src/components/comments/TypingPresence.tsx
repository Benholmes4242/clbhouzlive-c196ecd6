/**
 * TypingPresence — Shows who is currently typing using Supabase Realtime presence.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TypingPresenceProps {
  postId: string;
  currentUserId?: string;
  currentUserName?: string;
  isDark: boolean;
  isTyping: boolean;
}

export const TypingPresence: React.FC<TypingPresenceProps> = ({
  postId,
  currentUserId,
  currentUserName,
  isDark,
  isTyping,
}) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Track current user's typing state
  useEffect(() => {
    if (!currentUserId || !postId) return;

    const channel = supabase.channel(`typing:${postId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const names: string[] = [];
        Object.entries(state).forEach(([uid, presences]) => {
          if (uid !== currentUserId && Array.isArray(presences)) {
            const p = presences[0] as any;
            if (p?.typing) names.push(p.name || 'Someone');
          }
        });
        setTypingUsers(names);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false, name: currentUserName || 'Someone' });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [postId, currentUserId, currentUserName]);

  // Debounced typing broadcast
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !currentUserId) return;

    if (isTyping) {
      channel.track({ typing: true, name: currentUserName || 'Someone' });
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        channel.track({ typing: false, name: currentUserName || 'Someone' });
      }, 3000);
    } else {
      channel.track({ typing: false, name: currentUserName || 'Someone' });
    }
  }, [isTyping, currentUserId, currentUserName]);

  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
        : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 22 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "flex items-center gap-2 px-5 overflow-hidden",
          isDark ? "text-white/40" : "text-muted-foreground/60"
        )}
      >
        {/* Animated dots */}
        <div className="flex items-center gap-[3px]">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className={cn(
                "w-[5px] h-[5px] rounded-full",
                isDark ? "bg-white/40" : "bg-muted-foreground/50"
              )}
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <span className="text-[11px] truncate">{label}</span>
      </motion.div>
    </AnimatePresence>
  );
};
