/**
 * Hub Swing Upload Page
 * Full-screen glass page that overlays the origin page.
 * States: idle → ready (file picked) → uploading → success | error
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHub } from '@/features/hub/useHub';
import '../home/hubTheme.css';
import { supabase } from '@/integrations/supabase/client';

type Status = 'idle' | 'ready' | 'uploading' | 'success' | 'error';

export function HubSwingUploadPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { open, navigateFromHub } = useHub();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const videoUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  const canGoBackToHub = Boolean((loc.state as any)?.backgroundLocation);

  const goBack = () => {
    if (canGoBackToHub) {
      open();
      nav(-1);
    } else {
      nav('/clubhouse', { replace: true });
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setMessage('Please pick a video file.');
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('ready');
    setMessage('');
  };

  const onCancel = () => {
    abortRef.current?.abort();
    setStatus('ready');
    setProgress(0);
  };

  const onUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    setProgress(2);

    try {
      abortRef.current = new AbortController();
      const tick = setInterval(() => {
        setProgress((p) => Math.min(98, p + 2));
      }, 200);

      const ts = Date.now();
      const ext = file.name.split('.').pop() || 'mp4';
      const path = `${ts}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('swings')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(tick);
      if (error) throw error;

      setProgress(100);
      setStatus('success');
      setMessage('Upload complete. Send to Swing Coach?');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setStatus('error');
      setMessage(err?.message || 'Upload failed. Please try again.');
      setProgress(0);
    } finally {
      abortRef.current = null;
    }
  };

  const onRunInBackground = () => {
    if (canGoBackToHub) {
      open();
      document.documentElement.classList.add('swing-upload-bg');
    }
  };

  const sendToSwingCoach = () => {
    navigateFromHub('/hub/swing-coach');
  };

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      document.documentElement.classList.remove('swing-upload-bg');
    };
  }, [videoUrl]);

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999] flex flex-col"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <button
          onClick={goBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Upload Swing</h1>
        <div className="w-16" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="max-w-md mx-auto space-y-3">
          {/* Tips */}
          <div className="hub-card">
            <div className="text-white/95 text-[15px] font-semibold mb-2">Best results</div>
            <ul className="text-white/70 text-[14px] space-y-1 list-disc list-inside">
              <li>Face-on or down-the-line, full body, good lighting</li>
              <li>Mention club + typical miss (e.g., Driver + Push Fade)</li>
              <li>Include swing speed or ball flight if known</li>
            </ul>
          </div>

          {/* Picker / Preview */}
          <div className="hub-card">
            {file ? (
              <>
                <div className="text-white/95 text-[15px] font-semibold mb-2">Selected video</div>
                <video
                  src={videoUrl}
                  className="hub-video"
                  playsInline
                  controls
                  preload="metadata"
                />
                <div className="hub-file-name">{file.name}</div>
                {status !== 'uploading' && status !== 'success' && (
                  <div className="hub-actions">
                    <button 
                      className="px-4 py-2 rounded-xl text-white/90 text-[14px] font-medium transition-colors"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                      onClick={() => setFile(null)}
                    >
                      Choose another
                    </button>
                    <button 
                      className="px-4 py-2 rounded-xl text-white text-[14px] font-medium transition-colors"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                      onClick={onUpload}
                    >
                      Upload to Swing Coach
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-white/95 text-[15px] font-semibold mb-3">Select a swing video</div>
                <input
                  id="swing-file"
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={onPick}
                  hidden
                />
                <label 
                  htmlFor="swing-file" 
                  className="inline-block px-4 py-2 rounded-xl text-white text-[14px] font-medium transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  Choose video
                </label>
              </>
            )}
          </div>

          {/* Uploading */}
          {status === 'uploading' && (
            <div className="hub-card">
              <div className="text-white/95 text-[15px] font-semibold mb-2">Uploading…</div>
              <div className="hub-progress">
                <div className="hub-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <div className="hub-actions">
                <button 
                  className="px-4 py-2 rounded-xl text-white/90 text-[14px] font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 rounded-xl text-white/90 text-[14px] font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onClick={onRunInBackground}
                >
                  Run in background
                </button>
              </div>
            </div>
          )}

          {/* Success / Error */}
          {(status === 'success' || status === 'error') && (
            <div className="hub-card">
              <div className="text-white/95 text-[15px] font-semibold mb-2">
                {status === 'success' ? 'Success' : 'Something went wrong'}
              </div>
              <div className="text-white/70 text-[14px] mb-3">{message}</div>
              <div className="hub-actions">
                {status === 'success' ? (
                  <>
                    <button 
                      className="px-4 py-2 rounded-xl text-white text-[14px] font-medium transition-colors"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                      onClick={sendToSwingCoach}
                    >
                      Send to Swing Coach
                    </button>
                    <button 
                      className="px-4 py-2 rounded-xl text-white/90 text-[14px] font-medium transition-colors"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                      onClick={goBack}
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="px-4 py-2 rounded-xl text-white/90 text-[14px] font-medium transition-colors"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                      onClick={() => setStatus(file ? 'ready' : 'idle')}
                    >
                      Try again
                    </button>
                    <button 
                      className="px-4 py-2 rounded-xl text-white/90 text-[14px] font-medium transition-colors"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                      onClick={goBack}
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HubSwingUploadPage;
