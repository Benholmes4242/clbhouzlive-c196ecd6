import React from 'react';
import { ArrowRight, Users } from 'lucide-react';
import SectionHeader from '../SectionHeader';

const T = {
  bgFrom: '#0F172A',
  bgTo: '#1e293b',
  amber: '#F7931E',
  amberDeep: '#FFB459',
  amberRingOuter: 'rgba(247,147,30,0.15)',
  amberRingInner: 'rgba(247,147,30,0.10)',
  white: '#FFFFFF',
  whiteMute: 'rgba(148,163,184,1)',
  whiteSoft: 'rgba(255,255,255,0.35)',
  hairline: 'rgba(247,147,30,0.18)',
};

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const BuildYourCircleCTA: React.FC = () => {
  const handleInviteClick = () => {
    document.getElementById('invite-to-clbhouz-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section style={{ padding: '20px 0 8px' }}>
      <SectionHeader
        eyebrow="BUILD YOUR CIRCLE"
        title="Get your friends on Clbhouz"
      />
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={handleInviteClick}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: 240,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 16,
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${T.bgFrom} 0%, ${T.bgTo} 100%)`,
            color: T.white,
            padding: 16,
            fontFamily: FONT,
            textAlign: 'left',
            boxShadow: '0 8px 24px -10px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.06) inset',
          }}
        >
          {/* decorative amber rings (match RivalryCard) */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: `1px solid ${T.amberRingOuter}`,
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -20,
              top: -20,
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: `1px solid ${T.amberRingInner}`,
              pointerEvents: 'none',
            }}
          />

          {/* eyebrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              position: 'relative',
            }}
          >
            <Users size={13} color={T.amber} strokeWidth={2.4} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.18em',
                color: T.amber,
                fontFamily: FONT,
              }}
            >
              UNLOCK THE FULL TAB
            </span>
          </div>

          {/* body */}
          <div style={{ position: 'relative' }}>
            <h3
              style={{
                fontFamily: FONT,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0,
                color: T.white,
              }}
            >
              Featured rounds, head-to-head records, fires, and PBs all live here.
            </h3>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 12,
                fontWeight: 500,
                color: T.whiteMute,
                lineHeight: 1.5,
                fontFamily: FONT,
              }}
            >
              Get your friends on Clbhouz to unlock the full Friends tab — your circle's rounds, head-to-head rivalries, leaderboards, and more.
            </p>
          </div>

          {/* footer with hairline divider matching RivalryCard */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              paddingTop: 10,
              borderTop: `0.5px solid ${T.hairline}`,
              position: 'relative',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: T.amberDeep,
                letterSpacing: '0.06em',
                fontFamily: FONT,
              }}
            >
              INVITE FRIENDS
            </span>
            <ArrowRight size={14} strokeWidth={2.6} color={T.amber} />
          </div>
        </button>
      </div>
    </section>
  );
};

export default BuildYourCircleCTA;
