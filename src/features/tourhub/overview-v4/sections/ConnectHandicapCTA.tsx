/**
 * ConnectHandicapCTA — final call-to-action row.
 */

import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { V4 } from '../tokens';

export function ConnectHandicapCTA() {
  const navigate = useNavigate();
  return (
    <section style={{ padding: '20px 16px 8px' }}>
      <button
        onClick={() => navigate('/handicap')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          textAlign: 'left',
          background: V4.surface,
          border: `0.5px solid ${V4.hairline}`,
          borderRadius: 14,
          padding: 14,
          cursor: 'pointer',
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: '34%', background: V4.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: V4.amber, fontWeight: 800 }}>
          H
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: V4.ink, letterSpacing: '-0.01em' }}>
            Connect your handicap
          </div>
          <div style={{ fontSize: 12, color: V4.inkSoft }}>
            See how you'd fare on this week's course.
          </div>
        </div>
        <ChevronRight size={18} color={V4.inkFaint} />
      </button>
    </section>
  );
}
