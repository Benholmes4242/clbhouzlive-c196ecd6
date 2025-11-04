import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { GamesTab } from '@/features/nearby/GamesTab';
import { PullToRefresh } from '@/components/PullToRefresh';

type GamesNearYouScreenProps = {
  onClose: () => void;
};

export function GamesNearYouScreen({ onClose }: GamesNearYouScreenProps) {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  // Refetch when the sheet opens
  useEffect(() => {
    if (params.get('sheet') === 'games') {
      const t = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['games'] });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [params, queryClient]);

  // Refetch on foreground/focus
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['games'] });
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
    return queryClient.invalidateQueries({ queryKey: ['games'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 pb-6">
        <h2 className="text-xl font-semibold text-white">Games Near You</h2>
        
        <GamesTab 
          onOpenCreate={() => nav('/hub?sheet=create-game')} 
        />
      </div>
    </PullToRefresh>
  );
}
