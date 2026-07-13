import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { EchoMessageMeta } from '../hooks/useEchoChatMessages';

const INK = '#1F2428';
const AMBER = '#F7931E';
const MUTED = '#AEB4BC';
const SUB = '#8A9099';
const TRACK = '#EDEFF2';

interface Props {
  meta: EchoMessageMeta | null | undefined;
}

function routeLabel(route: EchoMessageMeta['route'] | undefined): string {
  switch (route) {
    case 'single':
      return 'quick take';
    case 'dual':
      return 'cross-checked';
    case 'full':
      return 'weighted consensus';
    case 'live':
      return 'live analysis';
    default:
      return '';
  }
}

export const EchoConsensusLine: React.FC<Props> = ({ meta }) => {
  const [expanded, setExpanded] = useState(false);

  if (!meta || Object.keys(meta).length === 0) return null;

  const engines = typeof meta.engines === 'number' ? meta.engines : 0;
  const label = routeLabel(meta.route);

  let collapsed = 'Echo Intelligence';
  if (engines > 1 && label) collapsed += ` \u2022 ${label} \u2022 ${engines} engines`;
  else if (label) collapsed += ` \u2022 ${label}`;
  if (meta.live) collapsed += ' \u2022 live data';

  const strength =
    typeof meta.strength === 'number' && meta.strength > 0
      ? Math.max(0, Math.min(1, meta.strength))
      : null;
  const strengthPct = strength !== null ? Math.round(strength * 100) : null;

  return (
    <div style={{ marginTop: 6, paddingLeft: 2, width: '100%' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="active:opacity-70"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: AMBER,
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 10.5, color: MUTED, letterSpacing: 0.1 }}>
          {collapsed}
        </span>
        <ChevronDown
          size={10}
          color={MUTED}
          style={{
            transition: 'transform 180ms ease-out',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div
        style={{
          overflow: 'hidden',
          maxHeight: expanded ? 200 : 0,
          opacity: expanded ? 1 : 0,
          transition: 'max-height 180ms ease-out, opacity 180ms ease-out',
        }}
      >
        <div
          style={{
            marginTop: 8,
            padding: '12px',
            background: '#F8FAFC',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>
              Echo Intelligence
            </span>
            {label ? (
              <span style={{ fontSize: 10.5, color: MUTED }}>{label}</span>
            ) : null}
          </div>

          {engines > 1 ? (
            <span style={{ fontSize: 11, color: SUB }}>
              {engines} engines consulted
            </span>
          ) : null}

          {strength !== null && strengthPct !== null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  width: '100%',
                  height: 3,
                  background: TRACK,
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${strengthPct}%`,
                    height: '100%',
                    background: AMBER,
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: MUTED }}>
                consensus strength {strengthPct}%
              </span>
            </div>
          ) : null}

          {meta.live ? (
            <span style={{ fontSize: 11, color: SUB }}>
              grounded in live tour data
            </span>
          ) : null}

          {meta.cached ? (
            <span style={{ fontSize: 10, color: MUTED }}>instant answer</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EchoConsensusLine;
