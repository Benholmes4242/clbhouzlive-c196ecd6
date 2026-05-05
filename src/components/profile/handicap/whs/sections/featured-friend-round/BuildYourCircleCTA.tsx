import React from 'react';
import { ArrowRight, Users } from 'lucide-react';
import SectionHeader from '../SectionHeader';

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
            minHeight: 280,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 18,
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #0a1628, #060c16)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 18px',
            fontFamily: '"Geist", system-ui, sans-serif',
            textAlign: 'left',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 2.5,
            background: 'linear-gradient(90deg, rgba(245,158,11,0.8), transparent)',
          }} />

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 80% 0%, rgba(247,147,30,0.18) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} color="#F59E0B" strokeWidth={2.4} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#F59E0B' }}>
              UNLOCK THE FULL TAB
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <h3 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              margin: 0,
              color: '#fff',
            }}>
              Featured rounds, head-to-head records, fires, and PBs all live here.
            </h3>
            <p style={{
              margin: '14px 0 0',
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.5,
            }}>
              Get your friends on Clbhouz to unlock the full Friends tab — your circle's rounds, head-to-head rivalries, leaderboards, and more.
            </p>
            <div style={{
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              background: '#F7931E',
              color: '#fff',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}>
              Invite friends <ArrowRight size={15} strokeWidth={2.6} />
            </div>
          </div>
        </button>
      </div>
    </section>
  );
};

export default BuildYourCircleCTA;
