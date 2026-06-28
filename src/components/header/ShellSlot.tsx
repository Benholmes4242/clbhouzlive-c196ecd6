import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTourHeroOverlay } from '@/hooks/useTourHeroOverlay';

interface ShellSlotProps {
  children: React.ReactNode;
  dark?: boolean;
}

/**
 * ShellSlot
 * --------
 * Fixed container that pins tabs / pills / filter rows directly beneath
 * CompactHeader. Writes its own measured height to `--shell-extra-h`, but
 * via a SINGLETON STACK PUBLISHER so coexisting instances (KeepAlive) do
 * not thrash the variable on every navigation.
 *
 * Contract:
 *   - The most-recently-mounted ShellSlot owns the var.
 *   - On unmount, the previous owner re-publishes its measured value.
 *   - The var is only zeroed when NO ShellSlot is mounted — never mid-route
 *     transition. This eliminates the "0 → N" jump on page changes.
 */

type Owner = { id: number; height: number };
const stack: Owner[] = [];
let nextId = 1;

function publish() {
  const top = stack[stack.length - 1];
  const value = top ? `${top.height}px` : '0px';
  document.documentElement.style.setProperty('--shell-extra-h', value);
}

function register(initialHeight: number): number {
  const id = nextId++;
  stack.push({ id, height: initialHeight });
  publish();
  return id;
}

function update(id: number, height: number) {
  const owner = stack.find((o) => o.id === id);
  if (!owner || owner.height === height) return;
  owner.height = height;
  if (stack[stack.length - 1]?.id === id) publish();
}

function unregister(id: number) {
  const idx = stack.findIndex((o) => o.id === id);
  if (idx === -1) return;
  stack.splice(idx, 1);
  publish();
}

export const ShellSlot: React.FC<ShellSlotProps> = ({ children, dark = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const overlayActive = useTourHeroOverlay();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const initial = el.getBoundingClientRect().height;
    const id = register(initial);

    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? el.getBoundingClientRect().height;
      update(id, h);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      unregister(id);
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
        zIndex: 29,
        background: overlayActive ? 'transparent' : (dark ? '#0A0E14' : 'hsl(var(--background))'),
        borderBottom: overlayActive
          ? 'none'
          : (dark
              ? '1px solid rgba(255,255,255,0.06)'
              : '0.5px solid rgba(15,23,42,0.07)'),
        boxShadow: overlayActive || !scrolled
          ? 'none'
          : (dark
              ? '0 6px 18px -10px rgba(0,0,0,0.4)'
              : '0 6px 16px -6px rgba(15,23,42,0.18)'),
        transition: 'box-shadow 200ms ease',
      }}
    >
      {children}
    </div>
  );
};

export default ShellSlot;
