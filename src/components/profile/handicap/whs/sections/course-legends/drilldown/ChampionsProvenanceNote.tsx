import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const DISMISS_KEY = 'champions_provenance_dismissed_v1';

/**
 * ChampionsProvenanceNote — "official scores only" explainer above the
 * Champions search. Dismissible (persisted). Theme-agnostic via --hcp vars.
 */
export const ChampionsProvenanceNote: React.FC = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => {
      try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
    },
  );

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
  };

  return (
    <div
      style={{
        position: 'relative',
        margin: '12px 16px 0',
        padding: '13px 38px 13px 14px',
        background: 'linear-gradient(180deg, rgba(251,188,46,0.09), rgba(251,188,46,0.03))',
        border: '0.5px solid rgba(251,188,46,0.35)',
        borderRadius: 14,
        fontFamily: FONT,
      }}
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        style={{
          position: 'absolute', top: 9, right: 9, width: 22, height: 22,
          borderRadius: 999, border: 'none', background: 'var(--hcp-tint-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <X size={11} color="var(--hcp-t-60)" strokeWidth={2.6} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <ShieldCheck size={12} color="var(--hcp-gold-text)" strokeWidth={2.6} />
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--hcp-gold-text)', textTransform: 'uppercase' }}>
          Official scores only
        </span>
      </div>

      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--hcp-t-60)', lineHeight: 1.55, margin: 0 }}>
        That ace only counts if it's on your{' '}
        <b style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>official handicap record</b>.
        Log every round with your club or golf union to register it on your WHS record — no logged rounds, no crowns.{' '}
        <b
          role="button"
          onClick={() => navigate('/handicap')}
          style={{ color: 'var(--hcp-gold-text)', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          Sync your handicap ›
        </b>
      </p>
    </div>
  );
};
