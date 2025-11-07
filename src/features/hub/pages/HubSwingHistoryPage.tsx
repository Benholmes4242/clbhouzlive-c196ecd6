/**
 * Swing Coach History — swing analyses list only
 * Full-screen glass page overlaying the origin page.
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../home/hubTheme.css';
import { useSwingHistory } from '@/features/echo/hooks/useSwingHistory';
import { formatRelativeTime } from '@/utils/dateFormat';

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
      nav('/clubhouse', { replace: true });
    }
  };

  const { data: items = [], isLoading, error } = useSwingHistory({ limit: 50 });

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Simple Header */}
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
        <h1 className="text-white/90 text-[17px] font-semibold">Swing Coach History</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)] px-4 pt-4">
        <div className="space-y-4 pb-6">
          <div className="hub-card">
            <div className="hub-card-title">Recent swings</div>

            {isLoading && (
              <div className="hub-list">
                {[0,1,2,3,4].map(i => <div key={i} className="hub-skel-row" />)}
              </div>
            )}

            {!isLoading && error && (
              <div className="hub-msg">Couldn't load swing history. Please try again.</div>
            )}

            {!isLoading && !error && (
              <div className="hub-list">
                {items.length === 0 && (
                  <div className="hub-msg">No swing videos yet — upload one to get started.</div>
                )}
                {items.map(item => (
                  <button
                    key={item.id}
                    className="hub-row swing-row"
                    onClick={() => nav(`/hub/swing/history/${item.id}`, { state: loc.state })}
                    aria-label="Open swing analysis"
                  >
                    <div className="thumb">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" loading="lazy" />
                      ) : (
                        <div className="thumb-fallback">🏌️</div>
                      )}
                    </div>
                    <div className="hub-row-main">
                      <div className="hub-row-title">{item.title || 'Swing analysis'}</div>
                      <div className="hub-row-sub">{formatRelativeTime(item.created_at)}</div>
                    </div>
                    <div className="hub-row-trailing">›</div>
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
