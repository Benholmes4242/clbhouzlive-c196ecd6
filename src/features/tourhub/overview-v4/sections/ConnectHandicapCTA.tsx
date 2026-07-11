/**
 * ConnectHandicapCTA — amber-tinted card with title/sub/ink CTA button.
 */

import { useNavigate } from 'react-router-dom';
import { V4 } from '../tokens';

export function ConnectHandicapCTA() {
  const navigate = useNavigate();
  return (
    <section style={{ padding: '24px 20px 10px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'linear-gradient(140deg, rgba(247,147,30,0.12), rgba(247,147,30,0.04))',
          border: '1px solid rgba(247,147,30,0.30)',
          borderRadius: V4.cardRadius,
          padding: 16,
        }}
      >
        <div
          style={{
            width: 44, height: 44, borderRadius: '34%',
            background: V4.amberSoft, color: V4.amber,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16,
          }}
        >
          H
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: V4.ink, letterSpacing: '-0.01em' }}>
            Connect your handicap
          </div>
          <div style={{ marginTop: 2, fontSize: 11.5, color: V4.inkSoft }}>
            See how you'd fare on this week's course.
          </div>
        </div>
        <button
          onClick={() => navigate('/handicap')}
          style={{
            padding: '9px 14px',
            background: V4.ink,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Connect
        </button>
      </div>
    </section>
  );
}
