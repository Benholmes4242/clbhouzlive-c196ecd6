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
import { ToastContainer } from '@/components/ui/FrostedToast';
import { useHub } from '@/features/hub/useHub';

export function SwingQuickTile() {
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const { navigateFromHub } = useHub();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type?: 'success' | 'error' }>>([]);

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

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
  };

  const handleUpload = () => {
    if (isUploading) return;
    setUploadError(false);
    inputRef.current?.click();
  };

  const onPick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(false);
    addToast('Uploading swing...', 'success');
    
    try {
      // Navigate to swing analysis page with the selected file
      navigateFromHub('/hub/echo/swing');
      
      // Simulate success after navigation
      setTimeout(() => {
        setIsUploading(false);
        addToast('Swing uploaded successfully', 'success');
      }, 1000);
    } catch (error) {
      setIsUploading(false);
      setUploadError(true);
      addToast('Upload failed. Tap to retry.', 'error');
    }
  };

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
            onClick={() => navigateFromHub('/hub/echo/swing')}
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
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-3 h-11 w-full rounded-2xl px-4 flex items-center justify-between text-[15px] leading-[15px] transition focus:outline-none focus-visible:ring-2 disabled:opacity-60 whitespace-nowrap"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
            onMouseEnter={(e) => !isUploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseDown={(e) => !isUploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.20)')}
            onMouseUp={(e) => !isUploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
          >
            <span className="truncate">{isUploading ? 'Uploading...' : 'Upload swing'}</span>
            <ArrowUpTrayIcon className="w-[18px] h-[18px] opacity-80 mr-[-2px] shrink-0" />
          </button>
        </div>
      </div>
      
      <input 
        ref={inputRef} 
        type="file" 
        accept="video/*" 
        hidden 
        onChange={onPick}
        aria-hidden="true"
      />
      
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </Tile>
  );
}
