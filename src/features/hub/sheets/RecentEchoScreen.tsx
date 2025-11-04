import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AIChatHistory from '@/components/ai-chat/AIChatHistory';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';
import { PullToRefresh } from '@/components/PullToRefresh';

type RecentEchoScreenProps = {
  onClose: () => void;
};

export function RecentEchoScreen({ onClose }: RecentEchoScreenProps) {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  // Refetch when the sheet opens
  useEffect(() => {
    if (params.get('sheet') === 'recent-echo') {
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
          <AIChatHistory
            isOpen={true}
            onClose={onClose}
            onSelectMessage={(id) => console.log('Selected message:', id)}
            paneMode
            layout="page"
            defaultCategory="chat"
          />
        </div>
      </PullToRefresh>
    </EchoConversationsProvider>
  );
}
