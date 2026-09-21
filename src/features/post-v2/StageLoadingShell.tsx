/**
 * StageLoadingShell — the composer's ONLY loading silhouette.
 *
 * A fresh compose has NO loading state: media is local (object URLs from the
 * OS picker) and everything else is already in memory, so step 2 renders its
 * designed empty state immediately. Nothing here shimmers for a normal post.
 * This shell exists for the two moments that do wait on the network:
 *
 *   1. /post-v2 route chunk load (App.tsx Suspense fallback) — previously
 *      GenericPageSkeleton, a LIGHT page silhouette borrowed from another
 *      feature, flashing white before the dark full-bleed stage mounted.
 *   2. Edit mode hydration, while the post being edited is fetched.
 *
 * Geometry mirrors step 2 of StageComposer as it exists after phase 3 of the
 * unified composer: the shared header, a 72px media rail row at the top, a
 * caption block, then the two stacked cards (tag-a-course, detail rows), and
 * the full-width primary pill pinned to the foot. The rule is that a skeleton
 * expands outwards into the real thing and never rearranges, so every block
 * here sits where its real counterpart lands.
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

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: CT_DARK.elev,
        border: `1px solid ${CT_DARK.line}`,
        borderRadius: 16,
        margin: '12px 16px 0',
        padding: '14px 16px',
        ...style,
      }}
    >
      {children}
    </div>
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

    {/* Body — mirrors step 2's stack, top to bottom */}
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        padding: '2px 0 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Media rail — 72px thumbs, no-media state draws nothing here */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 16px 0', flex: 'none' }}>
        {[0, 1, 2].map((i) => (
          <Bar key={i} style={{ width: 72, height: 72, borderRadius: 10 }} />
        ))}
      </div>

      {/* Caption */}
      <div style={{ padding: '14px 16px 0', flex: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bar style={{ height: 14, width: '80%' }} />
        <Bar style={{ height: 14, width: '55%' }} />
        <Bar style={{ height: 14, width: '68%' }} />
      </div>

      {/* Tag-a-course card */}
      <Card style={{ marginTop: 18, flex: 'none' }}>
        <Bar style={{ height: 12, width: 110 }} />
      </Card>

      {/* Detail rows card */}
      <Card style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Bar style={{ height: 12, width: '45%' }} />
        <Bar style={{ height: 12, width: '60%' }} />
      </Card>
    </div>

    {/* Primary pill, pinned to the foot like the real one */}
    <div style={{ flex: 'none', padding: '10px 16px max(env(safe-area-inset-bottom), 14px)' }}>
      <Bar style={{ width: '100%', height: 47, borderRadius: 999 }} />
    </div>
  </div>
);

export default StageLoadingShell;
