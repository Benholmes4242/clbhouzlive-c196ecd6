/**
 * Echo Message Row Component
 */
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { EchoMessage } from '../state/echoTypes';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface EchoMessageRowProps {
  message: EchoMessage;
  onContextMenu?: (e: React.MouseEvent | React.TouchEvent, message: EchoMessage) => void;
}

export function EchoMessageRow({ message, onContextMenu }: EchoMessageRowProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id || null));
  }, []);
  
  const { data: userProfile } = useUserProfile(currentUserId);
  const isUser = message.role === 'user' || message.role === 'system';

  if (isUser) {
    return (
      <div className="flex justify-end mt-3" data-msg-id={message.id}>
        <div className="max-w-[80%] flex items-start gap-3">
          <div className="echo-bubble-user px-4 py-3 text-[15px] leading-relaxed text-[color:var(--echo-text-primary)] echo-bubble-enter">
            {message.content}
          </div>
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-medium text-white/90 overflow-hidden">
            {userProfile?.profile_photo_url ? (
              <img src={userProfile.profile_photo_url} alt="You" className="w-full h-full object-cover" />
            ) : (
              <span>{userProfile?.display_name?.[0]?.toUpperCase() || 'Y'}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mt-3" data-msg-id={message.id}>
      <div className="max-w-[92%] flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[color:var(--echo-accent)]/20 border border-[color:var(--echo-accent)]/30 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-[color:var(--echo-accent)]">e</span>
        </div>
        <div className="flex-1">
          <div className="echo-card px-4 py-3 text-[15px] leading-relaxed text-[color:var(--echo-text-primary)] echo-bubble-enter">
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
            {message.meta?.error && <div className="mt-2 text-xs text-red-400">Error: {message.meta.error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
