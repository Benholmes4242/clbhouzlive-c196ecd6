import React from 'react';
import { Crown, X } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Props {
  window: 'all_time' | '90d';
  onClose: () => void;
}

/** "What are Champions?" explainer — opened from the rail's ⓘ. */
export const ChampionsExplainerCard: React.FC<Props> = ({ window, onClose }) => (
  <div
    style={{
      position: 'relative',
      margin: '2px 16px 12px',
      padding: '13px 38px 13px 14px',
      background: 'var(--hcp-bg-1)',
      border: '0.5px solid var(--hcp-line)',
      borderRadius: 14,
      boxShadow: '0 6px 24px rgba(15,23,42,0.10)',
      fontFamily: FONT,
    }}
  >
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      style={{
        position: 'absolute', top: 9, right: 9, width: 22, height: 22,
        borderRadius: 999, border: 'none', background: 'var(--hcp-tint-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}
    >
      <X size={11} color="var(--hcp-t-60)" strokeWidth={2.6} />
    </button>

    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <Crown size={12} color="#B26818" strokeWidth={2.6} fill="#FBBC2E" />
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--hcp-gold-text)', textTransform: 'uppercase' }}>
        What are Champions?
      </span>
    </div>

    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--hcp-t-60)', lineHeight: 1.55, margin: 0 }}>
      The clubhouse records board, digitalised. Lowest gross, best Stableford, most birdies
      and more — ranked from{' '}
      <b style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>official WHS scores</b>{' '}
      at this course, {window === 'all_time' ? 'all time' : 'over the last 90 days'}.
    </p>
  </div>
);

export default ChampionsExplainerCard;
