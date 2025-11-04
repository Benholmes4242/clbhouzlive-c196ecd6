import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';
import { PullToRefresh } from '@/components/PullToRefresh';

type EchoChatScreenProps = {
  onClose: () => void;
};

export function EchoChatScreen({ onClose }: EchoChatScreenProps) {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  // Refetch when the sheet opens
  useEffect(() => {
    if (params.get('sheet') === 'echo') {
      const t = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [params, queryClient]);

  // Refetch on foreground/focus
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [queryClient]);

  const handleRefresh = () => {
    return queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  return (
    <EchoConversationsProvider>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="h-full w-full -mx-4 -mb-6">
          <AIChatOverlay
            isOpen={true}
            onClose={onClose}
            paneMode
            layout="page"
            initialTab="chat"
          />
        </div>
      </PullToRefresh>
    </EchoConversationsProvider>
  );
}
