/**
 * Swing Coach Tile - Merged with Swing History Preview
 * Shows last analysis thumbnail; full list in sheet
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HubTile from '../components/HubTile';

export function SwingCoachTile() {
  const nav = useNavigate();

  const { data: lastSwing, isLoading } = useQuery({
    queryKey: ['swingHistory'],
    staleTime: 1000 * 60, // 1 minute
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('pro_ai_analyses')
        .select('id, video_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data ?? null;
    },
  });

  const handleFooterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    nav('/hub?sheet=swing');
  };

  return (
    <HubTile
      title="Swing Coach"
      subtitle="Upload your swing"
      footer={
        <button
          onClick={handleFooterClick}
          className="text-[15px] font-medium transition hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          View all →
        </button>
      }
    >
      <div className="flex flex-col h-full justify-between">
        {isLoading && (
          <div className="mt-2 h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        )}

        {!isLoading && lastSwing && (
          <button
            onClick={() => nav('/hub?sheet=swing')}
            className="mt-2 relative rounded-xl overflow-hidden transition hover:opacity-90"
            style={{ aspectRatio: '16/9', background: 'rgba(0,0,0,0.4)' }}
          >
            {lastSwing.video_url && (
              <video
                src={lastSwing.video_url}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
              </div>
            </div>
          </button>
        )}

        {!isLoading && !lastSwing && (
          <div className="mt-2 text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            No swings yet
          </div>
        )}
      </div>
    </HubTile>
  );
}
