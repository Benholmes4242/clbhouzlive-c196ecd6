/**
 * Swing Coach History — swing analyses list only
 * Full-screen page with standard Hub light theme styling
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HubHeader } from '../components/HubHeader';
import '../home/hubThemeLight.css';
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
        backgroundColor: 'var(--hub-glass)',
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
      nav('/hub', { replace: true });
    }
  };

  const { data: items = [], isLoading, error } = useSwingHistory({ limit: 50 });

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: 'var(--hub-backdrop)',
          backdropFilter: `blur(var(--hub-backdrop-blur))`,
          WebkitBackdropFilter: `blur(var(--hub-backdrop-blur))`,
        }} 
      />
      
      {/* Glass Sheet */}
      <div
        className="hub-glass-page fixed inset-0"
        style={{
          background: 'var(--hub-bg-start)',
          border: '1px solid var(--hub-stroke-subtle)',
          boxShadow: 'var(--hub-shadow-main)',
        }}
      >
        <HubHeader title="Swing Coach History" onBack={goBack} />

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
                      borderBottom: '1px solid var(--hub-stroke-subtle)',
                    }}
                  />
                ))}
              </div>
            )}

            {!isLoading && error && (
              <div className="hub-msg" style={{ padding: '14px 16px 12px', color: 'var(--hub-text-sub)' }}>
                Couldn't load swing history. Please try again.
              </div>
            )}

            {!isLoading && !error && (
              <div>
                {items.length === 0 && (
                  <div className="hub-msg" style={{ padding: '14px 16px 12px', color: 'var(--hub-text-sub)' }}>
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
                      borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--hub-stroke-subtle)',
                    }}
                    onClick={() => nav(`/hub/swing/history/${item.id}`, { state: loc.state })}
                    aria-label="Open swing analysis"
                  >
                    <Thumb src={item.thumbnail_url} />
                    <div className="flex-1 min-w-0">
                      <div style={{ color: 'var(--hub-text)', fontWeight: 600, fontSize: '15px' }} className="truncate">
                        {item.title || 'Swing analysis'}
                      </div>
                      <div style={{ color: 'var(--hub-text-sub)', fontSize: '13px', marginTop: '2px' }}>
                        {formatRelativeTime(item.created_at)}
                      </div>
                    </div>
                    <div style={{ color: 'var(--hub-text-dim)', fontSize: '20px' }}>›</div>
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
