/**
 * RenderProbe — leaf component used to attribute render-loop sources across
 * the provider tree. Emits a `[VDIFF] probe.render` console.info on every
 * render, gated on the DBG pill (isPerfEnabled). Renders null. NOT memoised
 * so it re-renders whenever its parent does. Zero-cost when DBG is off.
 */
import { isPerfEnabled } from '@/perf/navTiming';

interface Props {
  name: string;
}

export function RenderProbe({ name }: Props) {
  if (isPerfEnabled()) {
    // eslint-disable-next-line no-console
    console.info('[VDIFF] probe.render', {
      name,
      t: Math.round(performance.now()),
    });
  }
  return null;
}

export default RenderProbe;
