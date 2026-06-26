import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { haptic } from '@/utils/haptics';

/**
 * Start (or open existing) DM with another user.
 *
 * Returns `{ startDM, isStarting }` where `isStarting` is the user id currently being
 * processed (or `null` when idle), so multiple buttons in the same render can each
 * show their own loading state by comparing against the target user id.
 *
 * On success navigates to `/messages/:conversationId`, which `MessagesPage`
 * picks up via its `useParams` deep-link handler.
 */
export function useStartDM() {
  const { user } = useSupabaseSession();
  const { getOrCreateDM } = useMessagingContext();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState<string | null>(null);

  const startDM = useCallback(
    async (
      targetId: string,
      targetActorType: 'personal' | 'business' = 'personal',
    ) => {
      if (!user || !targetId) return;
      if (targetActorType === 'personal' && targetId === user.id) return;
      if (isStarting) return; // prevent double-tap

      setIsStarting(targetId);
      haptic('light');

      try {
        const conversationId = await getOrCreateDM(targetId, targetActorType);
        if (conversationId) {
          navigate(`/messages/${conversationId}`);
        } else {
          toast.error('Could not start conversation');
        }
      } catch {
        toast.error('Could not start conversation');
      } finally {
        setIsStarting(null);
      }
    },
    [user, isStarting, getOrCreateDM, navigate]
  );

  return { startDM, isStarting };
}
