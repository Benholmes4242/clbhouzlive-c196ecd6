/**
 * StageLoadingShell — the composer's ONLY loading silhouette.
 *
 * A fresh compose has NO loading state: media is local (object URLs from the
 * OS picker), page 1 renders its designed empty state immediately, and page 2's
 * state is already in memory when the wizard advances. So nothing here
 * shimmers for a normal post. This shell exists for the two moments that do
 * wait on the network:
 *
 *   1. /post-v2 route chunk load (App.tsx Suspense fallback) — previously
 *      GenericPageSkeleton, a LIGHT page silhouette borrowed from another
 *      feature, flashing white before the dark full-bleed stage mounted.
 *   2. Edit mode hydration, while the post being edited is fetched.
 *
 * Geometry mirrors StageComposer: header row (close glyph + title) over a 1px
 * rule, the stage filling the remaining height at padding 12 / radius 16, and
 * the tray's 46px thumbs above the caption lines.
 */
import React from 'react';
import { CT_DARK } from '@/features/_shared/composerTokens';

const FILL = 'rgba(255,255,255,0.06)';

function Bar({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="clb-shimmer-dark"
      style={{ backgroundColor: FILL, borderRadius: 6, ...style }}
    />
  );
}

export const StageLoadingShell: React.FC<{
  /** Rendered as text when the composer knows its title, else a bar. */
  title?: string;
  onClose?: () => void;
}> = ({ title, onClose }) => (
  <div
    aria-hidden={title ? undefined : 'true'}
    style={{
      position: 'fixed',
      inset: 0,
      height: '100dvh',
      background: CT_DARK.bg,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 12000,
    }}
  >
    {/* Header mirror */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 16px 13px',
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        background: CT_DARK.bg,
        borderBottom: `1px solid ${CT_DARK.line}`,
        flex: 'none',
      }}
    >
      {onClose ? (
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 30,
            height: 30,
            flex: 'none',
            borderRadius: 999,
            background: CT_DARK.elev,
            border: 0,
            color: CT_DARK.ink,
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          {'\u2039'}
        </button>
      ) : (
        <Bar style={{ width: 30, height: 30, borderRadius: 999, flex: 'none' }} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        {title ? (
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: CT_DARK.ink,
              letterSpacing: '-0.015em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        ) : (
          <Bar style={{ height: 12, width: 96 }} />
        )}
      </div>
    </div>

    {/* Stage block */}
    <div style={{ flex: '1 1 0', minHeight: 0, padding: 12 }}>
      <Bar style={{ width: '100%', height: '100%', borderRadius: 16 }} />
    </div>

    {/* Tray thumbs + caption lines */}
    <div
      style={{
        flex: 'none',
        padding: '8px 12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <Bar key={i} style={{ width: 46, height: 46, borderRadius: 10 }} />
        ))}
      </div>
      <Bar style={{ height: 14, width: '80%' }} />
      <Bar style={{ height: 14, width: '55%' }} />
    </div>
  </div>
);

export default StageLoadingShell;
