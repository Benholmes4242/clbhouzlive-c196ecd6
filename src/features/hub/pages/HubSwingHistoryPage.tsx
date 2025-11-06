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
    <div className="hub-glass-page">
      <div className="hub-page-header">
        <button className="hub-back" onClick={goBack} aria-label="Back">‹ Back</button>
        <div className="hub-title">Swing Coach History</div>
        <div style={{ width: 44 }} />
      </div>

      <div className="hub-page-body">
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
                  className="hub-row"
                  onClick={() => {}}
                  aria-label="Open swing analysis"
                >
                  <div className="hub-row-leading">🏌️</div>
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
  );
}
