/**
 * HeroWireTicker — Tour Hub hero leaderboard band.
 *
 * A dark wire ticker (36px tall, #15171F) that lives at the bottom of the
 * HybridHero, replacing the old MiddleBand + LeaderboardBand two-band stack.
 * Delegates to the shared `TickerShell` so behaviour matches the Explore-tab
 * WireTicker (seamless -50% loop, pause-on-touch, reduced-motion swap).
 *
 * Ties are NOT collapsed — every player renders as their own entry so the
 * ticker reads "T6 · Herbert · −8 · T6 · Kim · −8 · T6 · Jarvis · −8" rather
 * than grouping them into one chip.
 *
 * Live state feeds top-10 rows. Results state feeds the final top-10.
 * Upcoming with no rows: caller may pass `emptyStateFacts` — the band then
 * shows the "FIELD SOON" wire with rotating tournament facts (dates, venue,
 * defender, prior winner, purse, pulsing "Announced soon"). Zero facts and
 * zero rows → the band is absent (returns null) so the hero collapses onto
 * the page divider.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TickerShell } from '@/components/shared/wire/TickerShell';
import { fmtScore, type TickerRow } from '../HybridHero.utils';
import { NUMERIC_STYLE } from '../HybridHero.constants';
import { TOPAR_UNDER_DARK } from '../../../_shared/tokens';

const BG = '#15171F';
const AMBER = '#F7931E';
const GOLD = '#FDE68A';

function scoreColor(s: number): string {
  // ONE red for under par on dark — see TOPAR_UNDER_DARK in _shared/tokens.
  if (s < 0) return TOPAR_UNDER_DARK;
  if (s > 0) return 'rgba(255,255,255,0.55)';
  return 'rgba(255,255,255,0.90)';
}


export interface TickerFact {
  label: string;
  value: string;
  /** DEFENDS label renders in champion gold (#FDE68A). */
  labelGold?: boolean;
  /** Pulse the LABEL element opacity (used for "Announced soon"). */
  pulseLabel?: boolean;
}

interface HeroWireTickerProps {
  rows: TickerRow[];
  /** When rows is empty, render this "awaiting the field" wire instead. */
  emptyStateFacts?: TickerFact[];
  /**
   * 'continuation' — the always-on hero board below already shows the leading
   * positions, so this strip continues from the next one and is labelled as
   * such. 'top10' (default) is the standalone case.
   */
  labelKind?: 'top10' | 'continuation';
}

const PULSE_STYLE_ID = 'hero-wire-ticker-pulse';
function ensurePulseKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PULSE_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = PULSE_STYLE_ID;
  s.textContent = `
@keyframes hero-wire-fact-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
.hero-wire-fact-pulse { animation: hero-wire-fact-pulse 2.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .hero-wire-fact-pulse { animation: none !important; opacity: 1 !important; } }
`;
  document.head.appendChild(s);
}

function factNode(fact: TickerFact, key: string): ReactNode {
  return (
    <span
      key={key}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 36,
        marginRight: 24,
      }}
    >
      <span
        className={fact.pulseLabel ? 'hero-wire-fact-pulse' : undefined}
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: fact.labelGold ? GOLD : 'rgba(255,255,255,0.45)',
        }}
      >
        {fact.label}
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 13,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.90)',
          whiteSpace: 'nowrap',
        }}
      >
        {fact.value}
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 3,
          height: 3,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.25)',
          marginLeft: 16,
          alignSelf: 'center',
        }}
      />
    </span>
  );
}

function EmptyStateBar({
  facts,
  labelText,
}: {
  facts: TickerFact[];
  labelText: string;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    ensurePulseKeyframes();
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);

  const leftAccessory = (
    <div
      style={{
        padding: '0 12px',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: AMBER,
        background: 'rgba(247,147,30,0.16)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        borderRight: '0.5px solid rgba(255,255,255,0.10)',
        zIndex: 2,
      }}
    >
      {labelText}
    </div>
  );

  // <2 facts OR reduced-motion → static, no marquee.
  if (facts.length < 2 || reduced) {
    return (
      <section
        style={{
          background: BG,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          overflow: 'hidden',
        }}
        aria-label={labelText}
      >
        {leftAccessory}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            overflowX: 'auto',
            flex: 1,
          }}
        >
          {facts.map((f, i) => factNode(f, `f-${i}`))}
        </div>
      </section>
    );
  }

  ensurePulseKeyframes();
  return (
    <TickerShell
      items={facts.map((f, i) => factNode(f, `f-${i}`))}
      itemKey={(i) => `field-fact-${i}`}
      height={36}
      background={BG}
      gap={0}
      durationSec={Math.max(30, facts.length * 6)}
      padding="0 16px"
      ariaLabel={labelText}
      leftAccessory={leftAccessory}
      edgeFadeColor={BG}
    />
  );
}

export function HeroWireTicker({
  rows,
  emptyStateFacts,
  labelKind = 'top10',
}: HeroWireTickerProps) {
  const { t } = useTranslation('tourhub');

  const safeRows = rows ?? [];

  // Empty-state branch — "awaiting the field" wire.
  if (safeRows.length === 0 && emptyStateFacts && emptyStateFacts.length > 0) {
    return <EmptyStateBar facts={emptyStateFacts} labelText={t('overview.hero.fieldSoon')} />;
  }
  // Zero rows AND zero facts → band absent (hero collapses).
  if (safeRows.length === 0 && emptyStateFacts && emptyStateFacts.length === 0) {
    return null;
  }

  const nodes = safeRows.map((r) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 7,
        ...NUMERIC_STYLE,
        fontSize: 12,
      }}
    >
      <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.42)', fontWeight: 700 }}>
        {r.rank}
      </span>
      <span
        style={{
          fontWeight: 600,
          color: 'rgba(255,255,255,0.94)',
          maxWidth: 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {r.shortName}
      </span>
      <span style={{ fontWeight: 700, color: scoreColor(r.score) }}>{fmtScore(r.score)}</span>
    </span>
  ));

  const label =
    labelKind === 'continuation'
      ? t('overview.ticker.alsoOutLabel')
      : t('overview.ticker.top10Label');
  const leftAccessory = (
    <div
      style={{
        padding: '0 12px',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: 'rgba(255,255,255,0.55)',
        background: BG,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        borderRight: '0.5px solid rgba(255,255,255,0.10)',
        zIndex: 2,
      }}
    >
      {label}
    </div>
  );

  return (
    <TickerShell
      items={nodes}
      itemKey={(i) => `${safeRows[i]?.rank}-${safeRows[i]?.shortName}-${i}`}
      height={36}
      background={BG}
      gap={22}
      durationSec={Math.max(40, safeRows.length * 5.5)}
      padding="0 16px"
      ariaLabel={label}
      leftAccessory={leftAccessory}
      edgeFadeColor={BG}
    />
  );
}
