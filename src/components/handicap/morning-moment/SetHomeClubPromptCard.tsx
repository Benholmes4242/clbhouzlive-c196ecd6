/**
 * SetHomeClubPromptCard — CTA to set primary_club_id.
 * Two render modes:
 *  - standalone (own eyebrow), used when the section IS just the CTA
 *  - inline (no eyebrow), used when paired with FriendsYesterdayCard
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK = '#0F172A';
const INK_55 = '#64748B';
const INK_10 = 'rgba(15,23,42,0.10)';
const AMBER = '#F7931E';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  userId: string;
  todayLabel: string | null;
  inline?: boolean;
}

const SetHomeClubPromptCard: React.FC<Props> = ({ userId, todayLabel, inline = false }) => {
  const navigate = useNavigate();

  const handleTap = () => {
    analyticsEvents.track('morning_moment_set_home_club_tapped', {
      user_id: userId,
    });
    navigate('/edit-profile');
  };

  return (
    <section aria-label="Set home club" style={{ padding: inline ? 0 : '20px 16px 8px' }}>
      {!inline && todayLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: INK_55,
              letterSpacing: '0.22em',
              fontFamily: FONT_GEIST,
            }}
          >
            TODAY · {todayLabel}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleTap}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          background: '#fff',
          border: `0.5px solid ${INK_10}`,
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 8,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: FONT_GEIST,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: `${AMBER}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MapPin size={20} color={AMBER} strokeWidth={2} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>Set your home club</div>
          <div style={{ fontSize: 11, color: INK_55, marginTop: 2 }}>
            See weather and conditions every day
          </div>
        </div>

        <ChevronRight size={16} color={INK_55} />
      </button>
    </section>
  );
};

export default SetHomeClubPromptCard;
