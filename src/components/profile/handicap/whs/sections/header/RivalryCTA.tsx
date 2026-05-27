import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Swords } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  rivalUserId: string;
  rivalFirstName: string | null;
}

export const RivalryCTA: React.FC<Props> = ({ rivalUserId, rivalFirstName }) => {
  const navigate = useNavigate();
  const name = rivalFirstName ?? 'them';

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <button
        onClick={() => navigate(`/handicap/rivalry/${rivalUserId}`)}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'linear-gradient(135deg, rgba(247,147,30,0.12) 0%, rgba(247,147,30,0.04) 100%)',
          border: '1px solid rgba(247,147,30,0.30)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'var(--hcp-t-100)',
          cursor: 'pointer',
          fontFamily: FONT,
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'rgba(247,147,30,0.18)',
          border: '1px solid rgba(247,147,30,0.40)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--hcp-amber-bold, #FBBC2E)',
          flexShrink: 0,
        }}>
          <Swords size={14} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.005em',
            lineHeight: 1.2,
          }}>
            How do you stack up against {name}?
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--hcp-t-60)',
            marginTop: 2,
          }}>
            See your head-to-head record and stats
          </div>
        </div>
        <ChevronRight size={16} color="var(--hcp-amber-bold, #FBBC2E)" />
      </button>
    </div>
  );
};
