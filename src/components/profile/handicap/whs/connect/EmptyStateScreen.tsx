import React from 'react';
import { ChevronRight, Check } from 'lucide-react';
import {
  INK, DIM, FAINT, HAIR, GREEN, GREEN_BG, FONT,
} from './approachStages';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

const FEATURES = [
  { title: 'Live official index',   sub: 'Moves the moment counting rounds land' },
  { title: 'Full score history',    sub: 'All your rounds imported on day one' },
  { title: 'Friends on clbhouz',    sub: 'See who from your club is already here' },
];

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => {
  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ fontFamily: FONT, padding: '20px 0 8px', justifyContent: 'space-between' }}
    >
      {/* Content zone */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
        {/* Headline */}
        <div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: '-0.035em',
              lineHeight: 1.06,
              color: INK,
              margin: 0,
            }}
          >
            One connection.<br />
            Every round, <span style={{ color: GREEN }}>live.</span>
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              color: DIM,
              margin: '14px 0 0',
              maxWidth: 300,
            }}
          >
            Link your official WHS index once. From then on it moves the moment your counting rounds land.
          </p>
        </div>

        {/* Feature list */}
        <div>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${HAIR}`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 11,
                  background: GREEN_BG,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Check size={13} color={GREEN} strokeWidth={3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>{f.title}</div>
                <div style={{ fontSize: 12.5, color: DIM, marginTop: 1 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pinned CTA */}
      <div style={{ padding: '14px 0 8px' }}>
        <button
          type="button"
          onClick={onPickCountry}
          style={{
            width: '100%',
            minHeight: 56,
            borderRadius: 16,
            background: INK,
            color: '#fff',
            border: 'none',
            fontFamily: FONT,
            fontSize: 16.5,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 8px 22px rgba(15,23,42,0.22)',
          }}
        >
          Tee off {'\u00B7'} Choose country
          <ChevronRight size={17} strokeWidth={2.4} />
        </button>

        {onDecline && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onDecline}
              style={{
                minHeight: 44,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                color: DIM,
              }}
            >
              I don't track a handicap
            </button>
            <div
              style={{
                fontSize: 11.5,
                color: FAINT,
                lineHeight: 1.45,
                maxWidth: 260,
                marginTop: 2,
              }}
            >
              Hides the Connect HCP button from your header. Turn it back on anytime in Settings.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyStateScreen;
