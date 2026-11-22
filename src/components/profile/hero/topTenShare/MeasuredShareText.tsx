import React from 'react';
import { fitTextRuns } from './measuredEllipsis';

interface Run { text: string; style?: React.CSSProperties }
interface Props { style: React.CSSProperties; runs: Run[] }

/** Canvas measures the computed font of each run; CSS overflow remains a safety net only. */
export function MeasuredShareText({ style, runs }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [fitted, setFitted] = React.useState<string[] | null>(null);
  const key = JSON.stringify(runs);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined' || el.getBoundingClientRect().width === 0 || getComputedStyle(el).textOverflow !== 'ellipsis') return;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return;
    const update = () => {
      let spanIndex = 0;
      const styles = runs.map((run) => getComputedStyle(run.style ? el.querySelectorAll('span')[spanIndex++] ?? el : el));
      const values = runs.map((run, i) => ({ ...run, computed: styles[i] }));
      const width = Number.parseFloat(getComputedStyle(el).width) || el.clientWidth;
      // The full string determines the intrinsic flex width. Keep that original
      // allocation when replacing it, rather than letting the ellipsis shrink it again.
      el.style.width = `${width}px`;
      const next = fitTextRuns(values, width, (text, run) => {
        const computed = run.computed;
        context.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
        const spacing = Number.parseFloat(computed.letterSpacing) || 0;
        return context.measureText(text).width + Math.max(0, Array.from(text).length - 1) * spacing;
      });
      setFitted((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    let active = true;
    void document.fonts.ready.then(() => { if (active) update(); });
    return () => { active = false; observer.disconnect(); };
    // Runs are serialised so parent renders cannot continually remeasure identical text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <div ref={ref} style={style}>{runs.map((run, i) => run.style
    ? <span key={i} style={run.style}>{fitted?.[i] ?? run.text}</span>
    : <React.Fragment key={i}>{fitted?.[i] ?? run.text}</React.Fragment>)}</div>;
}