/**
 * TYPE — THE HERO EXCEPTION (BRIEF_TOUR_OVERVIEW_TYPE_SCALE, Part 2).
 * The hero is a broadcast surface. Tracked-out caps over photography read
 * larger than their point size, so a ticker segment, a band label or a rank
 * marker takes the AXIS floor of 10 rather than the READ floor of 11 — the
 * same exception granted to the scorecard axis and the chart ticks. It covers
 * COORDINATES AND MARKERS ONLY. It does NOT cover leader names, tournament
 * names, course names, scores, or any sentence: those are language and take
 * 11. Nothing goes below 10.
 */
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
 *
 * CHROME YIELDS TO DATA — THE RULE BEHIND THE TWO-LINE STATIC CELL.
 * In `presentation="static"` a cell stacks the player's surname above its rank
 * and score rather than putting all three on one line, because four entries on
 * one line do not fit 390pt. When something has to give, THE LABEL GIVES: the
 * band label may ellipsise, the names never do. That is the opposite of the
 * usual instinct, which is to shorten the data so the chrome stays whole — so
 * it is written here: a member reads names and scores, and a clipped name is
 * unreadable information, where a clipped label is only untidy chrome. Do NOT
 * abbreviate or truncate names to make a label fit.
 *
 * MARQUEE VERSUS STATIC IS NOT THE DISTINCTION. The question is whether a
 * member might need to read ONE SPECIFIC ITEM. If they might, it cannot move:
 * leaderboard positions are information, so the ALSO OUT strip is static. The
 * story strip and the FIELD SOON rotating facts are atmosphere — nobody needs a
 * specific entry out of either — so those keep the marquee, which is why the
 * `presentation` default stays 'marquee' for every existing consumer.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TickerShell } from '@/components/shared/wire/TickerShell';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { fmtScore, type TickerRow } from '../HybridHero.utils';
import { NUMERIC_STYLE } from '../HybridHero.constants';
import { TOPAR_UNDER_DARK } from '../../../_shared/tokens';

// ONE CONTINUOUS SURFACE with the hero board below it — never a local copy of
// CHARCOAL again, or deepening the board silently leaves a seam here.
const BG = A.CANVAS;
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
   * NOTHING OVERLAYS THE FACTS (BRIEF_TOUR_OVERVIEW_UPCOMING_HERO 3).
   * Facts that a member must be able to READ — the date range and the venue in
   * the upcoming state, where the venue IS the content — render in a STATIC
   * block ABOVE the wire, never inside it. Two things were wrong with carrying
   * them in the marquee: the label chip sits at the strip's left edge with an
   * edge fade over the same pixels, so a scrolling fact passed UNDER it
   * ("...S OFF SEP 17 - 20"), and the right edge clipped the venue mid-word
   * ("The Cliffs at Waln..."). Both are unreadable rather than untidy, and a
   * member cannot pause or scrub a marquee to recover them.
   *
   * The venue here WRAPS rather than ellipsising: it is a name, the block owns
   * its own height, and half a course name is not a course name.
   */
  leadFacts?: TickerFact[];
  /**
   * 'continuation' — the always-on hero board below already shows the leading
   * positions, so this strip continues from the next one and is labelled as
   * such. 'top10' (default) is the standalone case.
   */
  labelKind?: 'top10' | 'continuation';
  /**
   * 'marquee' (DEFAULT, unchanged) — the ambient scrolling wire. Correct for
   * rotating FIELD SOON facts and for the news StoryLeaderboardStrip, where the
   * strip is atmosphere beside a headline.
   *
   * 'static' — no animation, no auto-scroll, no loop, no horizontal scroller.
   * Used by the hero's ALSO OUT continuation strip: those positions are
   * INFORMATION, and a member cannot pause, scrub or scroll a marquee, so half
   * a name was unreadable until the loop came round again. Static mode renders
   * STATIC_ROWS entries only (positions 7-10 in the continuation case) and the
   * FULL LEADERBOARD row directly beneath is the route to 11 and beyond.
   * Static mode deliberately has NO prefers-reduced-motion branch — there is
   * one treatment for everyone, because the old reduced-motion degrade was a
   * silent horizontal scroller with no affordance.
   */
  presentation?: 'marquee' | 'static';
}

/** Entries shown in `presentation="static"` — four fit 390pt without ellipsis. */
const STATIC_ROWS = 4;

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
          fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
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
        fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
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
  presentation = 'marquee',
}: HeroWireTickerProps) {
  const { t } = useTranslation('tourhub');

  const isStatic = presentation === 'static';
  const allRows = rows ?? [];
  const safeRows = isStatic ? allRows.slice(0, STATIC_ROWS) : allRows;

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
      <span style={{ fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */, color: 'rgba(255,255,255,0.42)', fontWeight: 700 }}>
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

  /**
   * STATIC CELL — name on top, rank + score beneath, inside the same 36px band.
   * The stack is what makes four entries fit 390pt with no ellipsis on a name:
   * one line each way costs the WIDER of name/score rather than their sum
   * (measured worst case 4 x 11-12 character surnames still clears the band).
   * NO ellipsis and no clamp on the name here — a half-name in a strip the
   * member cannot scrub is simply unreadable.
   */
  const staticCells = safeRows.map((r, i) => (
    <span
      key={`${r.rank}-${r.shortName}-${i}`}
      style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, ...NUMERIC_STYLE }}
    >
      <span
        style={{
          fontSize: 11,
          lineHeight: '13px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.94)',
          whiteSpace: 'nowrap',
        }}
      >
        {r.shortName}
      </span>
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'baseline', lineHeight: '13px' }}>
        <span style={{ fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */, fontWeight: 700, color: 'rgba(255,255,255,0.42)' }}>
          {r.rank}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(r.score) }}>
          {fmtScore(r.score)}
        </span>
      </span>
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
        fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
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

  // STATIC — one treatment for everyone. No marquee, no auto-scroll, no loop,
  // no overflow scroller, and deliberately no prefers-reduced-motion branch.
  // The ENTRIES are fixed width and the LABEL absorbs whatever is left: at
  // 390pt with the longest surnames and the longest translated label, the
  // label ellipsises before a player's name ever does. Chrome yields to data.
  if (isStatic) {
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
        aria-label={label}
      >
        <div
          style={{
            padding: '0 10px',
            fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'rgba(255,255,255,0.55)',
            background: BG,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            flex: '1 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            borderRight: '0.5px solid rgba(255,255,255,0.10)',
            zIndex: 2,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 10px',
            flex: '0 0 auto',
          }}
        >
          {staticCells}
        </div>
      </section>
    );
  }

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
