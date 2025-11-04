/**
 * Swing Tile
 * Upload swing + recent analysis preview
 */

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { Tile } from '../components/Tile';
import { useOpenSheet } from '@/features/hub/sheets/useOpenSheet';

export function SwingTile() {
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const openSheet = useOpenSheet();
  const [isUploading, setIsUploading] = useState(false);

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

  const handleUpload = () => {
    if (isUploading) return;
    inputRef.current?.click();
  };

  const onPick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    nav('/hub?sheet=swing', { state: { preselectedFileName: file.name } });
    setTimeout(() => setIsUploading(false), 1000);
  };

  return (
    <Tile
      title="Swing Coach"
      subtitle="Upload your swing"
      onViewAll={() => openSheet('swing')}
    >
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="h-9 w-full rounded-xl px-3 flex items-center justify-between text-[13px] transition disabled:opacity-60"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'var(--hub-text-body)',
          }}
        >
          <span>{isUploading ? 'Uploading...' : 'Upload swing'}</span>
          <ArrowUpTrayIcon className="w-4 h-4 opacity-70" />
        </button>

        {/* Recent swing thumbnail */}
        {lastSwing && (
          <button
            onClick={() => openSheet('swing', { id: lastSwing.id })}
            className="mt-auto rounded-xl overflow-hidden relative"
            style={{
              aspectRatio: '16/9',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {lastSwing.video_url ? (
              <>
                <video 
                  src={lastSwing.video_url} 
                  className="w-full h-full object-cover opacity-90"
                  muted 
                  playsInline
                />
                <div 
                  className="absolute right-2 bottom-2 rounded-lg px-2 py-1 text-[11px] font-medium"
                  style={{ 
                    background: 'rgba(0,0,0,0.5)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                  }}
                >
                  View
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px]" style={{ color: 'var(--hub-text-sub)' }}>
                No preview
              </div>
            )}
          </button>
        )}
      </div>

      <input 
        ref={inputRef} 
        type="file" 
        accept="video/*" 
        hidden 
        onChange={onPick}
      />
    </Tile>
  );
}
