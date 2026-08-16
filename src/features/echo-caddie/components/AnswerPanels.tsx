/**
 * BRIEF_ECHO_CADDIE §4 — the swipeable panels.
 *
 * Each panel: an eyebrow, ONE figure at hero scale, ONE chart OR figure group,
 * ONE line of advice, and the basis line. Then the dots and the composer.
 *
 * §4.2 ONE PANEL RENDERS NO DOTS. §4.6 the swipe is horizontal and the dots show
 * position; reduced motion suppresses the transition, not the swipe.
 */

import React, { useCallback, useRef, useState } from 'react';
import { EC, T } from '../tokens';
import { HolesBar } from './HolesBar';
import type { CaddiePanel } from '../lib/panels';

const Dots: React.FC<{ n: number; i: number }> = ({ n, i }) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingTop: 14 }}>
    {Array.from({ length: n }).map((_, k) => (
      <span
        key={k}
        style={{
          width: k === i ? 16 : 5,
          height: 5,
          borderRadius: 3,
          // Position, not a faded tone: two solid ink values.
          background: k === i ? EC.INK : EC.INK_3,
          transition: 'width 180ms ease',
        }}
      />
    ))}
  </div>
);

const Panel: React.FC<{ panel: CaddiePanel; index: number; total: number }> = ({ panel, index, total }) => (
  <article className="ec-panel" style={{ padding: '0 20px' }}>
    <div className="ec-glass ec-fade-in" style={{ borderRadius: 20, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={T.EYEBROW}>{panel.eyebrow}</span>
        {total > 1 && (
          <span style={{ ...T.MICRO, letterSpacing: '0.12em' }}>
            {index + 1}/{total}
          </span>
        )}
      </div>

      <div
        style={{
          ...(panel.heroFigure ? T.HERO : T.HERO_WORDS),
          // AMBER ONLY when the hero is the member's own figure.
          color: panel.heroFigure && panel.heroIsMine ? EC.AMBER : EC.INK,
          marginTop: 14,
        }}
      >
        {panel.hero}
      </div>

      {panel.chart && (
        <div style={{ marginTop: 18 }}>
          <HolesBar holes={panel.chart.holes} highlightHole={panel.chart.highlight} />
        </div>
      )}

      {!panel.chart && panel.figures && (
        <div style={{ display: 'flex', gap: 22, marginTop: 18 }}>
          {panel.figures.map((f) => (
            <div key={f.label}>
              <div style={{ ...T.FIG, color: f.mine ? EC.AMBER : EC.INK }}>{f.value}</div>
              <div style={{ ...T.EYEBROW, marginTop: 4 }}>{f.label}</div>
            </div>
          ))}
        </div>
      )}

      <p style={{ ...T.ADVICE, margin: '18px 0 0' }}>{panel.advice}</p>

      <div style={{ ...T.BASIS, marginTop: 14 }}>{panel.basis}</div>
    </div>
  </article>
);

export const AnswerPanels: React.FC<{ panels: CaddiePanel[] }> = ({ panels }) => {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setI((prev) => (prev === next ? prev : next));
  }, []);

  if (panels.length === 0) return null;

  return (
    <div>
      <div ref={ref} className="ec-panels" onScroll={onScroll}>
        {panels.map((p, k) => (
          <Panel key={p.id} panel={p} index={k} total={panels.length} />
        ))}
      </div>
      {/* §4.2 one idea -> one panel -> NO DOTS. */}
      {panels.length > 1 && <Dots n={panels.length} i={Math.min(i, panels.length - 1)} />}
    </div>
  );
};
