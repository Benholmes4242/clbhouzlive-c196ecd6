/** SHARE FOOTER — the composer's pinned 54px pill and its sub-line. ONE owner
 * so the composer page and the Preview page cannot drift (PV1: the preview
 * ends with the same Share / Schedule / Save changes pill the composer would
 * show, the same sub-line, and tapping it posts exactly as the composer's
 * button does). Structure is contractual: the pill is the sub-line's
 * previousElementSibling (viewPost1Composer.test.tsx reads it that way). */
import { Loader2 } from 'lucide-react';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { GP } from './golfPageTokens';

export function ShareFooter({ label, subLine, disabled, busy, onShare }: {
  label: string;
  subLine: string;
  disabled: boolean;
  busy: boolean;
  onShare: () => void;
}) {
  return (
    <div style={{ flex: 'none', background: GP.canvas, borderTop: `1px solid ${GP.line}`, padding: '10px 16px max(env(safe-area-inset-bottom), 14px)' }}>
      <button
        onClick={onShare}
        disabled={disabled}
        style={{
          width: '100%', height: 54, borderRadius: 999, border: 'none',
          fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em',
          background: disabled ? inkWithAlpha(SURFACE.dark.ink, 0.1) : GP.ink,
          color: disabled ? A.DIM : GP.onInk,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {busy
          ? <Loader2 size={16} className="animate-spin text-[var(--pf-ink)]" style={{ display: 'block', margin: '0 auto' }} />
          : label}
      </button>
      <div data-testid="share-sub" style={{ textAlign: 'center', fontSize: 11.5, color: GP.dim, marginTop: 8 }}>
        {subLine}
      </div>
    </div>
  );
}
