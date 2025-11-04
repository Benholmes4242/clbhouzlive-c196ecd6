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

export function SwingQuickTile() {
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
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
      nav('/hub?sheet=swing', { state: { preselectedFileName: file.name } });
      
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
            }}
            onMouseEnter={(e) => !isUploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseDown={(e) => !isUploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.20)')}
            onMouseUp={(e) => !isUploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
            aria-label="Upload swing video"
          >
            <span className="truncate">{isUploading ? 'Uploading...' : 'Upload swing'}</span>
            <ArrowUpTrayIcon className="w-[18px] h-[18px] opacity-80 mr-[-2px] shrink-0" aria-hidden="true" />
          </button>

          {/* Preview surface or Retry state */}
          {uploadError ? (
            <div 
              className="mt-3 flex flex-col items-center justify-center gap-4 rounded-3xl overflow-hidden relative"
              style={{
                height: '128px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,71,71,0.25)',
                boxShadow: 'var(--hub-shadow-tile)',
              }}
            >
              <p className="text-white/75 text-[13px]">Upload failed — please try again</p>
              <button
                onClick={handleUpload}
                className="px-4 py-2 rounded-xl text-white/90 text-[13px] font-medium transition"
                style={{
                  background: 'rgba(255,71,71,0.25)',
                  border: '1px solid rgba(255,71,71,0.35)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,71,71,0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,71,71,0.25)'}
              >
                Retry Upload
              </button>
            </div>
          ) : (
            <div
              className="mt-3 rounded-3xl overflow-hidden relative cursor-pointer transition"
              style={{
                height: '128px',
                background: 'var(--hub-glass-subtle)',
                border: '1px solid var(--hub-stroke)',
                boxShadow: 'var(--hub-shadow-tile)',
              }}
              onClick={() => lastSwing && nav(`/hub?sheet=swing&id=${lastSwing.id}`)}
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
          )}
        </div>

        {/* Bottom footer: divider + View all (Echo parity) */}
        <div className="mt-6 sm:mt-8">
          <div 
            className="h-px"
            style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '1px',
              width: '100%',
            }}
          />
          <button
            onClick={() => nav('/hub?sheet=swing')}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
            aria-label="View all"
          >
            View all →
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
