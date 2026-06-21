import React from 'react';
import { Send, Trophy, Check } from 'lucide-react';
import { INVITE_MILESTONES, tierForSent } from './inviteTiers';

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const AMBER = '#F7931E';
const GOLD = '#FBBC2E';

interface Props {
  sentCount: number;
  onClick?: () => void;
}

export const InviteQuestCard: React.FC<Props> = ({ sentCount, onClick }) => {
  const tier = tierForSent(sentCount);

  const tappableProps = onClick
    ? {
        onClick,
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};
  const cursor = onClick ? 'pointer' : 'default';

  // ── All tiers complete → celebratory rolling state ──
  if (!tier) {
    // Rolling beyond the last fixed tier: next round number every +5.
    const nextMark = Math.ceil((sentCount + 1) / 5) * 5;
    const prevMark = nextMark - 5;
    const within = sentCount - prevMark;
    const pct = Math.max(0, Math.min(100, Math.round((within / 5) * 100)));

    return (
      <div
        {...tappableProps}
        style={{
          marginTop: 10,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a3c2a 0%, #0f172a 100%)',
          padding: 18,
          position: 'relative',
          fontFamily: FONT,
          cursor,
        }}
      >
        <div style={{ position: 'absolute', right: -14, top: -14, opacity: 0.12 }}>
          <Trophy size={110} color="#fff" strokeWidth={1.5} />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13,
              background: `linear-gradient(135deg, ${AMBER}, ${GOLD})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Trophy size={24} color="#1A0F02" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Your circle is thriving 🎉</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
              {sentCount} friends invited — keep bringing them in
            </div>
          </div>
        </div>

        {/* Rolling progress to the next milestone */}
        <div style={{ position: 'relative', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              {sentCount} invited · next at {nextMark}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>
              {sentCount}
            </span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 5, overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: 5,
                background: `linear-gradient(90deg, ${AMBER}, ${GOLD})`,
                transition: 'width 0.5s',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Active tier ──
  const within = sentCount - tier.floor;
  const span = tier.goal - tier.floor;
  const pct = Math.round((within / span) * 100);

  return (
    <div
      {...tappableProps}
      style={{
        marginTop: 10,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line-2)',
        padding: 18,
        fontFamily: FONT,
        cursor,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 46, height: 46, borderRadius: 13,
            background: `linear-gradient(135deg, ${AMBER}, ${GOLD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Send size={22} color="#1A0F02" strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--hcp-t-100)' }}>{tier.title}</div>
          <div style={{ fontSize: 12, color: 'var(--hcp-t-60)', marginTop: 1 }}>{tier.sub}</div>
        </div>
      </div>

      {/* Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
        <div style={{ flex: 1, height: 10, background: 'var(--hcp-bg-2)', borderRadius: 6, overflow: 'hidden' }}>
          <div
            style={{
              width: `${pct}%`, height: '100%', borderRadius: 6,
              background: `linear-gradient(90deg, ${AMBER}, ${GOLD})`,
              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--hcp-t-100)', fontVariantNumeric: 'tabular-nums' }}>
          {within}/{span}
        </span>
      </div>

      {/* Milestone dot ladder — shows the whole journey */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 12 }}>
        {INVITE_MILESTONES.map((m, i) => {
          const done = sentCount >= m;
          const prev = i === 0 ? 0 : INVITE_MILESTONES[i - 1];
          const isNext = !done && sentCount >= prev;
          return (
            <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? `linear-gradient(135deg, ${AMBER}, ${GOLD})` : isNext ? 'var(--hcp-bg-1)' : 'var(--hcp-bg-2)',
                  border: isNext ? `2px solid ${AMBER}` : 'none',
                  boxSizing: 'border-box',
                }}
              >
                {done ? (
                  <Check size={10} color="#1A0F02" strokeWidth={3.5} />
                ) : (
                  <span style={{ fontSize: 9, fontWeight: 800, color: isNext ? AMBER : 'var(--hcp-t-40)' }}>{m}</span>
                )}
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, color: done ? AMBER : 'var(--hcp-t-40)' }}>{m}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InviteQuestCard;
