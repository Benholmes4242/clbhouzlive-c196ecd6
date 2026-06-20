import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ShellSlotProps {
  children: React.ReactNode;
}

/**
 * ShellSlot
 * --------
 * A fixed container that renders directly beneath CompactHeader and is shared
 * by every page that needs to pin tabs / pills / filter rows below the header.
 *
 * Contract:
 *   - Sits at top: calc(55px + var(--sat)) — flush under CompactHeader.
 *   - Same surface colour as the body (--background) so they read as one canvas.
 *   - Below CompactHeader on the z-axis (z-header - 1), above page content.
 *   - Writes its own measured height to --shell-extra-h on :root. Pages
 *     that consume the slot offset their main scroll container with
 *     paddingTop: var(--chrome-total-h), which composes CompactHeader
 *     (55px + safe-area) plus --shell-extra-h via CSS calc().
 *
 * No scroll listeners, no sticky positioning, no threshold transitions —
 * the shell is in its final position from mount.
 */
export const ShellSlot: React.FC<ShellSlotProps & { dark?: boolean }> = ({ children, dark = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Measure height → write to CSS variable
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const write = (h: number) => {
      document.documentElement.style.setProperty('--shell-extra-h', `${h}px`);
    };

    write(el.getBoundingClientRect().height);

    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? el.getBoundingClientRect().height;
      write(h);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--shell-extra-h', '0px');
    };
  }, []);

  // Soft shadow appears only after the body scrolls past 4px.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={ref}
      data-chrome="shell-slot"
      style={{
        position: 'fixed',
        top: 'calc(var(--header-h, 55px) + var(--sat, 0px) - 1px)',
        left: 0,
        right: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
        maxWidth: 480,
        zIndex: 29, // CompactHeader is var(--z-header) = 30; sit one below it.
        background: dark ? '#0A0E14' : 'hsl(var(--background))',
        borderBottom: dark
          ? '1px solid rgba(255,255,255,0.06)'
          : '0.5px solid rgba(15,23,42,0.07)',
        boxShadow: scrolled
          ? (dark
              ? '0 6px 18px -10px rgba(0,0,0,0.4)'
              : '0 6px 16px -6px rgba(15,23,42,0.18)')
          : 'none',
        transition: 'box-shadow 200ms ease',
      }}
    >
      {children}
    </div>
  );
};

export default ShellSlot;
