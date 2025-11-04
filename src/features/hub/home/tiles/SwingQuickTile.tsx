/**
 * Swing Coach Quick Upload Tile
 * Apple-frosted layout with upload pill and preview surface
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { Tile } from '../components/Tile';
import { ViewAllPill } from '../components/ViewAllPill';
import { showToast } from '@/utils/toast';

export function SwingQuickTile() {
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
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
    showToast('Uploading swing...', '⛳');
    
    // Navigate to swing analysis page with the selected file
    nav('/hub/echo/swing', { state: { preselectedFileName: file.name } });
    
    // Reset after navigation
    setTimeout(() => setIsUploading(false), 1000);
  };

  const thumbnail = lastSwing?.video_url;

  return (
    <Tile 
      title="Swing Coach" 
      subtitle="Upload for instant feedback"
      footer={<ViewAllPill onClick={() => nav('/hub/echo/history?tab=swing')} />}
    >
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* Upload pill with inline icon */}
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="h-11 sm:h-12 rounded-2xl px-4 sm:px-5 flex items-center justify-between text-[15px] w-full transition focus:outline-none focus-visible:ring-2 disabled:opacity-60"
          style={{
            background: 'var(--hub-glass)',
            border: '1px solid var(--hub-stroke-strong)',
            color: 'var(--hub-text)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
          }}
          onMouseEnter={(e) => !isUploading && (e.currentTarget.style.background = 'var(--hub-glass-hover)')}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--hub-glass)'}
          aria-label="Upload swing video"
        >
          <span>{isUploading ? 'Uploading...' : 'Upload a swing…'}</span>
          <ArrowUpTrayIcon className="w-5 h-5 opacity-70" aria-hidden="true" />
        </button>

        {/* Preview surface */}
        <div
          className="rounded-3xl overflow-hidden relative cursor-pointer transition"
          style={{
            height: '128px',
            background: 'var(--hub-glass-subtle)',
            border: '1px solid var(--hub-stroke)',
            boxShadow: 'var(--hub-shadow-tile)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
          }}
          onClick={() => lastSwing && nav(`/hub/echo/swing/${lastSwing.id}`)}
          role={lastSwing ? 'button' : 'presentation'}
          aria-label={lastSwing ? 'View latest swing analysis' : 'No swing available'}
        >
          {thumbnail ? (
            <>
              <video 
                src={thumbnail} 
                className="w-full h-full object-cover opacity-[.92]"
                muted 
                playsInline
              />
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)' }} 
              />
              <div 
                className="absolute right-3 bottom-3 rounded-xl px-2 h-8 flex items-center text-[12px] font-medium"
                style={{ 
                  background: 'rgba(0,0,0,.25)', 
                  border: '1px solid rgba(255,255,255,.14)',
                  color: 'rgba(255,255,255,.92)',
                }}
              >
                View
              </div>
            </>
          ) : (
            <div 
              className="w-full h-full animate-pulse"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.04))' }} 
            />
          )}
        </div>

        {/* Divider matching pill width */}
        <div 
          className="h-px"
          style={{
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '1px',
            width: '100%',
          }}
        />
      </div>
      
      <input 
        ref={inputRef} 
        type="file" 
        accept="video/*" 
        hidden 
        onChange={onPick}
        aria-hidden="true"
      />
    </Tile>
  );
}
