/**
 * Hub Swing Coach – Detail thread
 * Full-screen glass page opened from /hub/swing/history
 */
import React, { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '../home/hubTheme.css';
import { useSwingDetail } from '@/features/echo/hooks/useSwingDetail';
import { useEchoThreadMessages } from '@/features/echo/hooks/useEchoThreadMessages';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

export function HubSwingDetailPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { id } = useParams();
  
  const { data: swing, isLoading, error } = useSwingDetail(id);
  const { data: messages = [], isLoading: msgsLoading } = useEchoThreadMessages(swing?.session_id);

  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const cameFromHub = Boolean((loc.state as any)?.backgroundLocation);
  const goBack = () => {
    if (cameFromHub) nav(-1);
    else nav('/clubhouse', { replace: true });
  };

  const renderVideo = () => {
    if (!swing) return null;
    
    if (swing.video_url) {
      // Check if it's a Cloudflare Stream URL
      const streamIdMatch = swing.video_url.match(/\/([a-f0-9]{32})\//);
      if (streamIdMatch) {
        const hlsUrl = generateStreamHlsUrl(streamIdMatch[1]);
        return (
          <div className="rounded-2xl border border-white/10 mb-3 overflow-hidden bg-black/20">
            <EnhancedVideoPlayer
              src={hlsUrl}
              enableHLS
              controls
              playsInline
              className="w-full"
            />
          </div>
        );
      }
      
      // Direct video URL
      return (
        <div className="rounded-2xl border border-white/10 mb-3 overflow-hidden bg-black/20">
          <video
            src={swing.video_url}
            controls
            playsInline
            className="w-full"
          />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Header */}
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
        <h1 className="text-white/90 text-[17px] font-semibold">Swing Coach</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)] px-4 pt-4">
        <div className="space-y-4 pb-6">
          {isLoading && <div className="hub-msg">Loading swing…</div>}
          {error && !isLoading && <div className="hub-msg">Couldn't load swing.</div>}
          {!isLoading && !error && !swing && <div className="hub-msg">Swing not found.</div>}

          {!isLoading && swing && (
            <div className="hub-card">
              <div className="hub-card-title">Swing Analysis</div>
              <div className="hub-muted mb-3">
                {new Date(swing.created_at).toLocaleString()}
              </div>

              {renderVideo()}

              <div className="space-y-2">
                {msgsLoading && <div className="hub-msg">Loading conversation…</div>}
                {!msgsLoading && messages.length === 0 && (
                  <div className="hub-muted">No messages yet for this swing.</div>
                )}
                {!msgsLoading && messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-2xl px-3 py-2 border ${
                      m.role === 'user'
                        ? 'bg-white/8 border-white/10'
                        : 'bg-black/20 border-white/10'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
