/**
 * Hub Swing Coach – Detail thread
 * Full-screen glass page opened from /hub/swing/history
 */
import React, { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '../home/hubTheme.css';
import { useSwingHistory } from '@/features/echo/hooks/useSwingHistory';

export function HubSwingDetailPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { id } = useParams();
  const { data: items = [], isLoading, error } = useSwingHistory({ limit: 200 });

  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const item = items.find(x => String(x.id) === String(id));

  const cameFromHub = Boolean((loc.state as any)?.backgroundLocation);
  const goBack = () => {
    if (cameFromHub) nav(-1);
    else nav('/clubhouse', { replace: true });
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
          {!isLoading && !error && !item && <div className="hub-msg">Swing not found.</div>}

          {!isLoading && item && (
            <div className="hub-card">
              {/* Header/meta */}
              <div className="hub-card-title">{item.title || 'Swing Analysis'}</div>
              <div className="hub-muted mb-3">{new Date(item.created_at).toLocaleString()}</div>

              {/* Video thumbnail (using thumbnail_url) */}
              {item.thumbnail_url && (
                <div className="rounded-2xl border border-white/10 mb-3 overflow-hidden bg-black/20">
                  <img 
                    src={item.thumbnail_url} 
                    alt="Swing thumbnail"
                    className="w-full"
                  />
                </div>
              )}

              {/* Note: Full conversation history would require fetching from pro_ai_analyses */}
              <div className="hub-muted text-sm">
                Full swing analysis conversation history coming soon.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
