import React, { forwardRef } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

const AMBER = '#F7931E';
const AMBER_DEEP = '#E07F0E';
const INK = '#0F172A';
const INK_55 = '#64748B';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface ConnectHandicapCardProps {
  headline: string;
  sub: string;
  /** Optional small line under the CTA (e.g. "Takes 30 seconds · We never post on your behalf"). */
  microcopy?: string;
  onTap: () => void;
}

/**
 * ConnectHandicapCard — the single shared "connect your WHS handicap" conversion
 * card. Light "ghost index preview" design: copy + amber CTA on the left, a
 * dashed empty index slot + ghost sparkline on the right. Used by the avatar
 * dropdown (HandicapMasthead) and Tour Hub home (HomeConnectHandicapModule).
 */
export const ConnectHandicapCard = forwardRef<HTMLButtonElement, ConnectHandicapCardProps>(
  ({ headline, sub, microcopy, onTap }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onTap}
      className="block w-full text-left active:scale-[0.995] transition-transform"
      style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: 14,
        border: `0.5px solid ${HAIRLINE}`,
        padding: '18px 18px 16px',
        fontFamily: FONT,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 108px',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        {/* Left: copy + CTA */}
        <div style={{ minWidth: 0 }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: AMBER }}>
            <ShieldCheck size={13} strokeWidth={2.2} />
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              WHS · Official Handicap
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.015em',
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            {headline}
          </div>

          {/* Sub */}
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: INK_55,
              lineHeight: 1.4,
              marginBottom: 12,
            }}
          >
            {sub}
          </div>

          {/* CTA */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DEEP} 100%)`,
              boxShadow: '0 3px 10px rgba(247,147,30,0.32)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Connect handicap
            <ArrowRight size={14} strokeWidth={2.4} />
          </span>

          {microcopy && (
            <div
              style={{
                marginTop: 10,
                fontSize: 10.5,
                fontWeight: 500,
                color: INK_55,
              }}
            >
              {microcopy}
            </div>
          )}
        </div>

        {/* Right: ghost index slot */}
        <div
          aria-hidden
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
            paddingTop: 2,
          }}
        >
          {/* Dashed empty index squircle */}
          <div
            style={{
              width: 108,
              height: 84,
              borderRadius: 16,
              border: `1px dashed ${HAIRLINE.replace('0.08', '0.22')}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 300,
                color: INK_55,
                letterSpacing: '-0.01em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              —·—
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK_55,
              }}
            >
              Your Index
            </div>
          </div>

          {/* Ghost dashed sparkline ending with amber dot */}
          <svg width={108} height={22} viewBox="0 0 108 22" fill="none" style={{ display: 'block' }}>
            <path
              d="M2 16 L18 12 L34 14 L50 8 L66 11 L82 6 L100 9"
              stroke="rgba(15,23,42,0.22)"
              strokeWidth={1.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 3"
              fill="none"
            />
            <circle cx={100} cy={9} r={3} fill={AMBER} />
          </svg>
        </div>
      </div>
    </button>
  ),
);

ConnectHandicapCard.displayName = 'ConnectHandicapCard';

export default ConnectHandicapCard;
