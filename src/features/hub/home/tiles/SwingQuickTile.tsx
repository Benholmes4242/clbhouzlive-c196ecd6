/**
 * Swing Coach Quick Upload Tile
 * Apple-frosted layout with upload pill and preview surface
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';

export function SwingQuickTile() {
  const nav = useNavigate();
  const { navigateFromHub } = useHub();

  const openSwingPage = () => {
    navigateFromHub('/hub/swing');
  };

  const { data: lastSwing } = useQuery({
    queryKey: ['lastSwing'],
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
    }
  });

  const thumbnail = lastSwing?.video_url;

  return (
    <Tile 
      title="Swing Coach" 
      subtitle="Upload your swing"
      align="center"
      footer={
        <div className="mt-auto pt-4">
          <div 
            className="h-px"
            style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '1px',
              width: '100%',
            }}
          />
          <button
            onClick={openSwingPage}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
          >
            View all →
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Upload pill with inline icon */}
          <button
            onClick={openSwingPage}
            className="mt-3 h-11 w-full rounded-2xl px-4 flex items-center justify-between text-[15px] leading-[15px] transition focus:outline-none focus-visible:ring-2 whitespace-nowrap"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseDown={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.20)'}
            onMouseUp={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
          >
            <span className="truncate">Upload swing</span>
            <ArrowUpTrayIcon className="w-[18px] h-[18px] opacity-80 mr-[-2px] shrink-0" />
          </button>
        </div>
      </div>
    </Tile>
  );
}
