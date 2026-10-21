/**
 * CB13 — THE HANDICAP GATE ON THE ROUNDS TAB.
 *
 * A signed-in member with no synced handicap cannot appear on any board on
 * this page, so the page states that fact: the REAL page (live sections, live
 * queries, live rounds) renders behind the profile hero's crop-and-fade
 * (EXAMPLE_DISPLAY_STYLE pattern: one opacity + one mask gradient, stops from
 * the signed-off mock), inert like HeroConnectExample, with a non-dismissible
 * card over it. Four states, decided by roundsGateState:
 *   signedOut — no userId: the page renders exactly as today, no gate.
 *   loading   — connection read unsettled OR errored: the page's own loading
 *               treatment holds; a failed read never accuses a connected member.
 *   gated     — settled, no connection: frost + card.
 *   connected — settled, connection row present: the page, byte-identical.
 *
 * THE PREDICATE: useWhsConnection(userId).isSuccess && data != null.
 * fetchWhsConnection returns the member's UNDELETED (deleted_at IS NULL)
 * whs_connections row for provider 'england_golf' — the rule circleHandicap.ts
 * states: an undeleted row proves the federation connection exists.
 *
 * The card is not dismissible: no close, no swipe-away, no remembered
 * dismissal. The white CTA and the sheet's foot both route to
 * /manage/handicap, the same destination as every other connect CTA (ERT1).
 *
 * CB14.1 — the sheet's reach line is two independent clauses, each rendered
 * only when its own list has a name to give it: see gateReachLine.
 *
 * CB15 — ScoresLeaderboardsPage mounts this component only for `gated`.
 * Reporting stays here: a ref latches the impression before track, surviving
 * query-driven rerenders and StrictMode effect replay; a real remount resets
 * it. Payloads carry gate_state (and row for row taps), never member/WHS data.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { WHS_COUNTRIES, getCountryById, type WhsCountry } from '@/lib/whs/whsCountries';
import { EYEBROW } from './Section';

export type RoundsGateState = 'signedOut' | 'loading' | 'gated' | 'connected';

/** The four CB13 states. `isSuccess`, never `!isLoading`: a disabled query is
 *  pending-idle, so isLoading is false before the read has ever run (see the
 *  warning on useWhsConnection). */
export function roundsGateState(
  userId: string | undefined,
  connection: { isSuccess: boolean; data: unknown },
): RoundsGateState {
  if (!userId) return 'signedOut';
  if (!connection.isSuccess) return 'loading';
  return connection.data ? 'connected' : 'gated';
}

/** The hero's frost: one compositing opacity plus the mask gradient. Stops are
 *  the mock's — solid to 42%, gone by 86%. */
const FROST: CSSProperties = {
  opacity: 0.5,
  WebkitMaskImage: 'linear-gradient(to bottom, #000 0, #000 42%, transparent 86%)',
  maskImage: 'linear-gradient(to bottom, #000 0, #000 42%, transparent 86%)',
};

/** Frosted page visible above the card. An empty pool has nothing to frost,
 *  so the band collapses rather than leaving the card floating on black. */
const REVEAL = 300;
const REVEAL_EMPTY = 96;

/** CB14 — the sheet's one outbound link. England is the only supported
 *  provider (whsCountries.ts), so it is the only route we can honour; the
 *  Scotland/Wales/Ireland links CB13 shipped were deleted because following
 *  them cannot end in a connectable handicap. "Join a club" has no link:
 *  there is no club finder we can verify beyond England. */
const GATE_LINKS = {
  england: 'https://www.englandgolf.org/igolf',
} as const;

/** CB14 — the sheet's quiet truth line, derived from WHS_COUNTRIES rather
 *  than a fixed string, so it cannot drift the day a second provider
 *  launches. Returns the supported bodies' names (joined "A and B") and the
 *  unsupported home nations (Scotland, Wales, Ireland — comingSoon flags
 *  like France/US are launch partnerships, not home nations, and stay
 *  unmentioned). The sentence is assembled in the locale file from these
 *  two lists. */
const HOME_NATION_IDS = ['gb-sct', 'gb-wls', 'ie'] as const;

export function gateReach(): { supportedBodies: string[]; unsupportedHomeNations: string[] } {
  const supportedBodies = WHS_COUNTRIES.filter((c) => c.supported).map((c) => c.body);
  const unsupportedHomeNations = HOME_NATION_IDS.map((id) => getCountryById(id))
    .filter((c): c is WhsCountry => c !== null && !c.supported)
    .map((c) => c.name);
  return { supportedBodies, unsupportedHomeNations };
}

/** "A, B and C" — the brief's phrasing for the home-nations list. */
function andJoin(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** CB14.1 — the sheet's reach line, built from two independent clauses.
 *  Each clause renders only when its own list has a name to give it: with
 *  every home nation supported, the second clause would otherwise print an
 *  empty subject ("… today.  aren't supported yet."), and with nothing
 *  connected the first clause would do the same. Both lists empty returns ''
 *  and the caller renders no element at all, so an empty line cannot take its
 *  margin. Two present clauses are joined by exactly one space. */
export function gateReachLine(
  supportedBodies: string[],
  unsupportedHomeNations: string[],
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  const clauses: string[] = [];
  if (supportedBodies.length > 0) {
    clauses.push(t('amateur.gate.sheetReachSupported', { supported: andJoin(supportedBodies) }));
  }
  if (unsupportedHomeNations.length > 0) {
    clauses.push(t('amateur.gate.sheetReachUnsupported', { unsupported: andJoin(unsupportedHomeNations) }));
  }
  return clauses.join(' ');
}

function GateCard({ onConnect, onNoHandicap }: { onConnect: () => void; onNoHandicap: () => void }) {
  const { t } = useTranslation('courses');
  const bullets = [
    t('amateur.gate.bulletBoards'),
    t('amateur.gate.bulletComps'),
    t('amateur.gate.bulletIndex'),
    t('amateur.gate.bulletCourses'),
  ];
  return (
    <div
      data-rounds-gate-card=""
      style={{
        background: A.PANEL,
        borderTop: `1px solid ${A.BORDER}`,
        borderRadius: '20px 20px 0 0',
        padding: '22px 20px',
        boxShadow: '0 -24px 60px rgba(0,0,0,0.72)',
      }}
    >
      <div style={{ ...EYEBROW, lineHeight: 1, color: A.AMBER }}>{t('amateur.gate.eyebrow')}</div>
      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.18, color: A.INK }}>
        {t('amateur.gate.title')}
      </div>
      <div style={{ marginTop: 9, fontSize: 13, fontWeight: 600, color: A.BODY, lineHeight: 1.5 }}>
        {t('amateur.gate.body')}
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {bullets.map((line) => (
          <div key={line} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, fontWeight: 600, color: A.BODY, lineHeight: 1.4 }}>
            <span aria-hidden style={{ flex: 'none', width: 5, height: 5, borderRadius: 999, background: A.AMBER, marginTop: 6 }} />
            <span>{line}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onConnect}
        style={{
          marginTop: 17, display: 'block', width: '100%', border: 0, cursor: 'pointer',
          background: A.INK, color: A.CANVAS, borderRadius: 12, padding: 14,
          fontFamily: SANS, fontSize: 13.5, fontWeight: 800, letterSpacing: '0.02em', textAlign: 'center',
        }}
      >
        {t('amateur.gate.cta')}
      </button>
      {/* The quiet second path: the SeeAll treatment (EYEBROW, A.MUTE, 13px
          chevron), centred as the mock has it. */}
      <button
        type="button"
        onClick={onNoHandicap}
        style={{
          marginTop: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%',
          border: 0, background: 'transparent', padding: 0, cursor: 'pointer',
          fontFamily: SANS, ...EYEBROW, color: A.MUTE,
        }}
      >
        {t('amateur.gate.noHandicap')}
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

function GateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const rows: { key: 'england' | 'club'; href: string | null }[] = [
    { key: 'england', href: GATE_LINKS.england },
    { key: 'club', href: null },
  ];
  const { supportedBodies, unsupportedHomeNations } = gateReach();
  /** CB14.1 — two independent clauses; '' when neither list has a name, and
   *  then the element below is not rendered at all. */
  const reachLine = gateReachLine(supportedBodies, unsupportedHomeNations, t);
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="rounds-gate-sheet-title">
      <div style={{ padding: '12px 20px 32px', fontFamily: SANS }}>
        <div style={{ ...EYEBROW, lineHeight: 1, color: A.AMBER }}>{t('amateur.gate.sheetEyebrow')}</div>
        <h2 id="rounds-gate-sheet-title" style={{ margin: '5px 0 0', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: A.INK }}>
          {t('amateur.gate.sheetTitle')}
        </h2>
        <div style={{ marginTop: 9, fontSize: 13, fontWeight: 600, color: A.BODY, lineHeight: 1.5 }}>
          {t('amateur.gate.sheetBody')}
        </div>
        <div style={{ marginTop: 16 }}>
          {rows.map((r) => {
            const body = (
              <>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: A.INK }}>{t(`amateur.gate.${r.key}`)}</span>
                  <span style={{ display: 'block', marginTop: 3, fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, color: A.MUTE }}>{t(`amateur.gate.${r.key}Sub`)}</span>
                </span>
                {r.href ? <ChevronRight size={13} style={{ flex: 'none', color: A.MUTE }} /> : null}
              </>
            );
            const rowStyle: CSSProperties = {
              display: 'flex', alignItems: 'center', gap: 11, width: '100%',
              padding: '11px 0', border: 0, borderBottom: `1px solid ${A.SOFT}`,
              background: 'transparent', textAlign: 'left', fontFamily: SANS,
            };
            return r.href ? (
              <button key={r.key} type="button" onClick={() => {
                analyticsEvents.track('rounds_gate_sheet_row_tap', { gate_state: 'gated', row: r.key });
                window.open(r.href as string, '_blank', 'noopener,noreferrer');
              }} style={{ ...rowStyle, cursor: 'pointer' }}>
                {body}
              </button>
            ) : (
              <div key={r.key} onClick={() => analyticsEvents.track('rounds_gate_sheet_row_tap', { gate_state: 'gated', row: r.key })} style={rowStyle}>{body}</div>
            );
          })}
        </div>
        {/* CB14/CB14.1 — the quiet truth line: not a row, no chevron, A.MUTE
            at the sheet's small type. Lists are derived from WHS_COUNTRIES via
            gateReach(), so the sentence tracks support as providers launch.
            With nothing to say in either clause the element is absent, so an
            empty line never takes its margin. */}
        {reachLine ? (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${A.SOFT}`, fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, color: A.MUTE }}>
            {reachLine}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => { onClose(); navigate('/manage/handicap'); }}
          style={{
            marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%',
            border: 0, background: 'transparent', padding: 0, cursor: 'pointer',
            fontFamily: SANS, ...EYEBROW, color: A.MUTE,
          }}
        >
          {t('amateur.gate.sheetConnect')}
          <ChevronRight size={13} />
        </button>
      </div>
    </BottomSheet>
  );
}

/** The gated render: the real page cropped and faded behind the card. The
 *  frost is absolute over the whole block and inert — no tap, focus or
 *  keyboard reaches a row — while the card sits in flow at the bottom, so the
 *  block ends with the card and nothing below it. */
export function RoundsGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [poolEmpty, setPoolEmpty] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const impressionTracked = useRef(false);

  useEffect(() => {
    if (impressionTracked.current) return;
    impressionTracked.current = true;
    analyticsEvents.track('rounds_gate_viewed', { gate_state: 'gated' });
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setPoolEmpty(el.scrollHeight < 40);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden
        ref={(el) => el?.setAttribute('inert', '')}
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...FROST }}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      <div style={{ position: 'relative', paddingTop: poolEmpty ? REVEAL_EMPTY : REVEAL }}>
        <GateCard onConnect={() => {
          analyticsEvents.track('rounds_gate_connect_tap', { gate_state: 'gated' });
          navigate('/manage/handicap');
        }} onNoHandicap={() => {
          analyticsEvents.track('rounds_gate_no_handicap_tap', { gate_state: 'gated' });
          setSheetOpen(true);
        }} />
      </div>
      <GateSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
