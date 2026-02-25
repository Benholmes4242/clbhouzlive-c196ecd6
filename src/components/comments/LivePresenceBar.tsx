/**
 * LivePresenceBar — Shows avatars of users currently viewing the comments sheet.
 * Uses Supabase Realtime Presence on a channel per post.
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl?: string;
}

interface LivePresenceBarProps {
  postId: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  isDark: boolean;
}

const MAX_VISIBLE = 5;

export const LivePresenceBar: React.FC<LivePresenceBarProps> = ({
  postId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
}) => {
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!currentUserId || !postId) return;

    const channel = supabase.channel(`presence:comments:${postId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        Object.entries(state).forEach(([uid, presences]) => {
          if (uid !== currentUserId && Array.isArray(presences) && presences.length > 0) {
            const p = presences[0] as any;
            users.push({
              userId: uid,
              name: p.name || 'Someone',
              avatarUrl: p.avatarUrl,
            });
          }
        });
        setViewers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: currentUserName || 'Someone',
            avatarUrl: currentUserAvatar,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [postId, currentUserId, currentUserName, currentUserAvatar]);

  if (viewers.length === 0) return null;

  const visible = viewers.slice(0, MAX_VISIBLE);
  const overflow = viewers.length - MAX_VISIBLE;

  const label = viewers.length === 1
    ? `${viewers[0].name} is here`
    : viewers.length === 2
      ? `${viewers[0].name} and ${viewers[1].name} are here`
      : `${viewers[0].name} and ${viewers.length - 1} others are here`;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 36 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-2 px-5 py-1 flex-shrink-0",
        isDark ? "border-b border-white/5" : "border-b border-border/20"
      )}
    >
      <div className="flex items-center -space-x-1.5">
        <AnimatePresence>
          {visible.map((user) => (
            <motion.div
              key={user.userId}
              initial={{ opacity: 0, scale: 0.5, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className="relative">
                <SquircleAvatar
                  size={22}
                  src={user.avatarUrl}
                  alt={user.name}
                  fallback={user.name.charAt(0)}
                  hideRing
                />
                {/* Pulse indicator */}
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border",
                  isDark ? "bg-emerald-400 border-[#0d0d0d]" : "bg-emerald-500 border-white"
                )} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {overflow > 0 && (
          <div className={cn(
            "w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold",
            isDark ? "bg-white/15 text-white/70" : "bg-muted text-muted-foreground"
          )}>
            +{overflow}
          </div>
        )}
      </div>
      <span className={cn(
        "text-[11px] truncate",
        isDark ? "text-white/35" : "text-muted-foreground/50"
      )}>
        {label}
      </span>
    </motion.div>
  );
};
