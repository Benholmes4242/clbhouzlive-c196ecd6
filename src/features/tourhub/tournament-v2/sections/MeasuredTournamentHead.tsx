/** Brief 17 continuation: measure the full title before switching, exactly
 * as the World rankings head does. A second Moments candidate is measured
 * once, never used to switch back. Width/font/title changes restart at full. */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { measureTitleLines } from '../../overview/sections/measureTitleLines';
import { TournamentSectionHead, type TournamentSectionHeadProps } from './TournamentSectionHead';

interface Props extends TournamentSectionHeadProps {
  fallbackTitle?: string;
  finalTitle?: string;
  chooseFallback: (lines: number) => boolean;
  chooseFinal?: (lines: number) => boolean;
  children?: (fallback: boolean) => ReactNode;
}

export function MeasuredTournamentHead({ title, fallbackTitle, finalTitle, chooseFallback, chooseFinal, children, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<'full' | 'short' | 'plain'>('full');
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current?.querySelector<HTMLElement>('[data-tv-head-title]');
    if (!element) return;
    if (form === 'full' && fallbackTitle && chooseFallback(measureTitleLines(element))) setForm('short');
    else if (form === 'short' && finalTitle && chooseFinal?.(measureTitleLines(element))) setForm('plain');
  }, [title, fallbackTitle, finalTitle, form, tick, chooseFallback, chooseFinal]);
  useLayoutEffect(() => {
    const head = ref.current;
    if (!head) return;
    let width = head.getBoundingClientRect().width;
    const recheck = () => { setForm('full'); setTick(n => n + 1); };
    recheck();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      const next = head.getBoundingClientRect().width;
      if (next !== width) { width = next; recheck(); }
    });
    observer?.observe(head);
    let alive = true;
    document.fonts?.ready?.then(() => { if (alive) recheck(); });
    document.fonts?.addEventListener('loadingdone', recheck);
    return () => { alive = false; observer?.disconnect(); document.fonts?.removeEventListener('loadingdone', recheck); };
  }, [title, fallbackTitle, finalTitle]);
  const fallback = !!fallbackTitle && form !== 'full';
  const shown = fallback ? form === 'plain' && finalTitle ? finalTitle : fallbackTitle : title;
  return <><div ref={ref} data-tv-measured-head data-tv-head-form={form}>
    <TournamentSectionHead {...props} title={shown ?? title} />
  </div>{children?.(fallback)}</>;
}