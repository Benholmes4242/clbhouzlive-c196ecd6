/**
 * CE1 example: fixed supplied data uses HeroHandicapDisplay, never member reads.
 * Hiding is exclusively query-driven via hideConnectPrompt in ProfileHero;
 * the existing decline hook owns write, invalidation and the sole Settings toast.
 * CEX1 crop is wrapper-only: 11 + 5 + 42.3 + 12 + 64 + 18 + 11 + 8
 * + 33.7 into the form tile = 205px. Recompute if those dimensions change.
 */
import React from 'react';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { useDeclineHandicapChip } from '@/lib/whs/useDeclineHandicapChip';
import { HeroHandicapDisplay } from './HeroHandicapDisplay';

/** Illustrative only. Never compute these values from a real account. */
export const CONNECT_EXAMPLE = {
  index: 12.4,
  movements: [
    { key: 'short', delta: -0.8, direction: 'down', window: '90 days' },
    { key: 'long', delta: -2.1, direction: 'down', window: '12 months' },
  ],
  series: [13.2, 13.1, 13.0, 12.95, 12.92, 12.89, 12.88, 12.85, 12.82, 12.8, 12.77, 12.75, 12.76, 12.73, 12.7, 12.67, 12.64, 12.65, 12.62, 12.59, 12.56, 12.57, 12.54, 12.51, 12.53, 12.5, 12.47, 12.48, 12.45, 12.4],
  rounds: [
    { id: 'example-1', date: '2026-01-01', gross_score: 86, value: 3.5, movement: 0, course_name: 'Sundridge Park' },
    { id: 'example-2', date: '2026-01-02', gross_score: 91, value: 5.4, movement: 0, course_name: 'The London Golf Club' },
    { id: 'example-3', date: '2026-01-03', gross_score: 84, value: -0.2, movement: -0.1, course_name: 'Sundridge Park' },
    { id: 'example-4', date: '2026-01-04', gross_score: 88, value: 0.8, movement: -0.1, course_name: 'Sundridge Park' },
    { id: 'example-5', date: '2026-01-05', gross_score: 90, value: 1.2, movement: 0, course_name: 'West Kent' },
  ],
} as const;

/** One compositing operation for the entire real display; pill/actions stay full strength. */
const EXAMPLE_OPACITY = 0.5;
export const EXAMPLE_DISPLAY_STYLE: React.CSSProperties = { opacity: EXAMPLE_OPACITY, maxHeight: 205, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to bottom, #000 0, #000 58%, transparent 100%)', maskImage: 'linear-gradient(to bottom, #000 0, #000 58%, transparent 100%)' };
const NO_TAP = () => {};

export const HeroConnectExample: React.FC<{ t: TFunction<'profile'>; onConnect?: () => void }> = ({ t, onConnect }) => {
  const decline = useDeclineHandicapChip();
  const navigate = useNavigate();
  return (
    <div data-testid="hero-connect-panel" style={{ marginTop: 14 }}>
      <div data-example-pill="" style={{ display: 'inline-block', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.FAINT, border: `1px solid ${A.BORDER}`, borderRadius: 999, padding: '3px 8px', marginBottom: 12 }}>
        {t('hero.connectExamplePill', { defaultValue: 'Example' })}
      </div>
      <div data-example-display="" ref={(element) => element?.setAttribute('inert', '')} style={EXAMPLE_DISPLAY_STYLE}>
        <HeroHandicapDisplay
          t={t} shownIndex={CONNECT_EXAMPLE.index}
          deltaLines={CONNECT_EXAMPLE.movements.map((line) => ({ ...line }))}
          slot={null} verdict={null} series={[...CONNECT_EXAMPLE.series]}
          chartColor={INDEX_DELTA.dark.improved} chartFillTop={0.28}
          axisWindow={CONNECT_EXAMPLE.movements[0].window} windowDays={90}
          bars={CONNECT_EXAMPLE.rounds.map((round) => ({ ...round }))}
          byId={new Map(CONNECT_EXAMPLE.rounds.map((round) => [round.id, round]))}
          countingKnown={false} countingN={0} loweredN={0}
          tilesWord="five" isSelf onStatTap={NO_TAP} tap={() => NO_TAP} navigate={navigate} example
        />
      </div>
      <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.5, color: A.BODY }}>
        <b style={{ color: A.INK, fontWeight: 700 }}>{t('hero.connectExampleLead', { defaultValue: 'Connect your official handicap' })}</b>{t('hero.connectExampleRest', { defaultValue: ' and this becomes yours.' })}
      </div>
      <div data-example-actions="" style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 11 }}>
        <Button variant="ghost" className="h-auto rounded-none p-0" onClick={onConnect} style={{ padding: 0, border: 0, background: 'transparent', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: A.INK, cursor: 'pointer' }}>
          {t('hero.connectExampleAction', { defaultValue: 'Connect ›' })}
        </Button>
        <Button variant="ghost" className="h-auto rounded-none p-0" onClick={decline} style={{ padding: 0, border: 0, background: 'transparent', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: A.DIM, cursor: 'pointer' }}>
          {t('hero.connectExampleHide', { defaultValue: 'Hide this' })}
        </Button>
      </div>
    </div>
  );
};