import { useCallback, useLayoutEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Z } from '@/config/zIndex';
import { useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { withDiscoverReturn } from '@/components/explore-tab-new/discoverReturnState';

/**
 * BRIEF_WATCH_SEE_ALL S3.2 — the solid, notch-safe header the two new library
 * pages sit behind: back control on the left, the section name centred, nothing
 * else. Same construction as the story pages' chrome; it owns its own height
 * variable so each page pads itself.
 */
export function LibraryChrome({ label }: { label: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  useSetChromeSuppressed(true);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--library-header-h', 'calc(env(safe-area-inset-top, 0px) + 47px)');
    return () => {
      document.documentElement.style.removeProperty('--library-header-h');
    };
  }, []);

  const back = useCallback(() => {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }
    // Cold entry has no Watch tab to return to, so land on it explicitly.
    navigate('/explore', { replace: true, state: withDiscoverReturn(null, { tab: 'gallery', scrollY: 0 }) });
  }, [location.key, navigate]);

  return (
    <header
      style={{
        position: 'fixed',
        inset: '0 0 auto',
        zIndex: Z.header,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: A.CANVAS,
        borderBottom: `1px solid ${A.BORDER}`,
        fontFamily: SANS,
      }}
    >
      <div style={{ position: 'relative', height: 47, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        <Button type="button" variant="ghost" size="icon" aria-label="Back" onClick={back} style={{ width: 36, height: 36, padding: 0, color: A.INK }}>
          <ArrowLeft size={19} strokeWidth={2.2} aria-hidden />
        </Button>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            color: A.INK,
            fontSize: 16,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {label}
        </div>
      </div>
    </header>
  );
}

/** Shared page furniture: eyebrow with the real total + 20/800 headline. */
export function LibraryHead({ total, title }: { total: number | null; title: string }) {
  return (
    <div style={{ padding: '18px 0 14px' }}>
      <div style={{ font: `700 11px/1 ${SANS}`, letterSpacing: 0.4, textTransform: 'uppercase', color: A.MUTE }}>
        {total == null ? '\u00A0' : `${total} ${total === 1 ? 'item' : 'items'}`}
      </div>
      <h1 style={{ margin: '8px 0 0', font: `800 20px/1.1 ${SANS}`, color: A.INK }}>{title}</h1>
    </div>
  );
}

/**
 * Ids stay plain strings: JSX type arguments break the dev tagger plugin.
 *
 * The rail is the canonical chip (RailChips) — the same object the Scores
 * board rails and the two Watch destinations use. The old underlined-text
 * treatment came from a brief that said "sort rail" without naming the chip.
 */
export function SortRail({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <RailChips
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel="Sort"
      style={{ marginBottom: 14 }}
    />
  );
}

export function LoadMore({ onPress, busy }: { onPress: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={busy}
      style={{
        width: '100%',
        minHeight: 46,
        marginTop: 18,
        border: `1px solid ${A.BORDER}`,
        borderRadius: 12,
        background: A.PANEL,
        color: A.INK,
        font: `700 13px/1 ${SANS}`,
        cursor: busy ? 'default' : 'pointer',
      }}
    >
      {busy ? 'Loading…' : 'Load more'}
    </button>
  );
}
