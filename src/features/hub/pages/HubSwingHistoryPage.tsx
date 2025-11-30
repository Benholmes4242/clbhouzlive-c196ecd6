/**
 * Swing Coach History — swing analyses list only
 * Full-screen glass page overlaying the origin page.
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../home/hubTheme.css';
import { useSwingHistory } from '@/features/echo/hooks/useSwingHistory';
import { formatRelativeTime } from '@/utils/dateFormat';

function Thumb({ src }: { src?: string | null }) {
  const [ready, setReady] = React.useState(!src);
  const [error, setError] = React.useState(false);

  return (
    <div 
      className="thumb"
      style={{
        width: '52px',
        height: '52px',
        borderRadius: '8px',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!ready && <div className="shimmer" style={{ width: '100%', height: '100%' }} aria-hidden="true" />}
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onLoad={() => setReady(true)}
          onError={() => { setError(true); setReady(true); }}
          style={{ 
            display: ready && !error ? 'block' : 'none',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : null}
      {(error || !src) && ready && (
        <div style={{ fontSize: '24px' }}>
          🏌️‍♂️
        </div>
      )}
    </div>
  );
}


export function HubSwingHistoryPage() {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const goBack = () => {
    if ((loc.state as any)?.backgroundLocation) {
      nav(-1);
    } else {
      // Deep link fallback - return to Hub
      nav('/hub', { replace: true });
    }
  };

  const { data: items = [], isLoading, error } = useSwingHistory({ limit: 50 });

  return (
    <div className="fixed inset-0 z-[9999] bg-background">
      {/* Content */}
      <div className="fixed inset-0">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b border-border bg-background">
        <button
          onClick={goBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Swing Coach History</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)]" style={{ paddingTop: '28px' }}>
        <div className="pb-6">
          {isLoading && (
            <div>
              {[0,1,2,3,4].map(i => (
                <div 
                  key={i} 
                  className="hub-skel-row"
                  style={{
                    padding: '14px 16px 12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="hub-msg" style={{ padding: '14px 16px 12px' }}>
              Couldn't load swing history. Please try again.
            </div>
          )}

          {!isLoading && !error && (
            <div>
              {items.length === 0 && (
                <div className="hub-msg" style={{ padding: '14px 16px 12px' }}>
                  No swing videos yet — upload one to get started.
                </div>
              )}
              {items.map((item, index) => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 text-left transition-transform active:scale-[0.985]"
                  style={{
                    background: 'transparent',
                    padding: '14px 16px 12px',
                    borderBottom: index === items.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                  onClick={() => nav(`/hub/swing/history/${item.id}`, { state: loc.state })}
                  aria-label="Open swing analysis"
                >
                  <Thumb src={item.thumbnail_url} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/95 font-semibold text-[15px] truncate">
                      {item.title || 'Swing analysis'}
                    </div>
                    <div className="text-white/60 text-[13px] mt-0.5">
                      {formatRelativeTime(item.created_at)}
                    </div>
                  </div>
                  <div className="text-white/40 text-xl">›</div>
                </button>
              ))}
             </div>
           )}
         </div>
       </div>
      </div>
    </div>
  );
}
