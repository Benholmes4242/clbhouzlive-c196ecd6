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
 * dismissal. The white text action and the sheet's foot both route to
 * /manage/handicap, the same destination as every other connect CTA (ERT1).
 *
 * The sheet shares the connect-page reach sentence through connectReach().
 *
 * CB15 — ScoresLeaderboardsPage mounts this component only for `gated`.
 * Reporting stays here: a ref latches the impression before track, surviving
 * query-driven rerenders and StrictMode effect replay; a real remount resets
 * it. Payloads carry gate_state (and row for row taps), never member/WHS data.
 */
import { useEffect, useLayoutEffect, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { connectReach } from '@/lib/whs/connectReach';
import { EYEBROW } from './Section';
import './roundsGate.css';

export type RoundsGateState = 'signedOut' | 'loading' | 'gated' | 'connected';

/** The four CB13 states. `isSuccess`, never `!isLoading`: a disabled query is
 *  pending-idle, so isLoading is false before the read has ever run (see the
 *  warning on useWhsConnection).
 *
 *  CB45 AMENDS CB13 — DO NOT RESTORE THE OLD RULE AS A "CORRECTNESS FIX".
 *  A failed read (`isError`: react-query sets it only after the retry policy
 *  has finished; a read still retrying stays pending) is SETTLED and falls to
 *  the UNGATED page, 'connected'. CB44 made the hold indefinite, so "failed =
 *  loading" would hold a member forever after a network blip. And the two
 *  wrong answers are not equal: the ordinary page shown to a gated member
 *  costs a conversion; the gate shown to a connected member tells them to
 *  connect a handicap they already have. The gate is a conversion device, not
 *  a privacy boundary, so on an unknown connection we fall toward the page. */
export function roundsGateState(
  userId: string | undefined,
  connection: { isSuccess: boolean; isError?: boolean; data: unknown },
): RoundsGateState {
  if (!userId) return 'signedOut';
  if (connection.isError) return 'connected';
  if (!connection.isSuccess) return 'loading';
  return connection.data ? 'connected' : 'gated';
}

/** CB36 — the glimpse: one compositing opacity plus the mask gradient, from
 *  gate-A-spec.html (solid to 66%) so the rounds read as content, not
 *  texture. CB38 — the fade now reaches zero: 0.10 at 92%, transparent at
 *  the cut, so the next section's eyebrow cannot ghost above the gate. */
const FROST: CSSProperties = {
  opacity: 0.74,
  WebkitMaskImage: 'linear-gradient(to bottom, #000 0, #000 66%, rgba(0,0,0,0.10) 92%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, #000 0, #000 66%, rgba(0,0,0,0.10) 92%, transparent 100%)',
};

/** CB36 — what counts as "one complete round" inside the glimpse. */
const GLIMPSE_ROW = '[data-standout-row], [data-board-row]';

/** CB36 short-screen rule. `rowBottom` is the first round row's bottom edge
 *  measured from the glimpse's top; null while no row has rendered. The
 *  glimpse shows only when one whole row fits; no row yet keeps the page's
 *  own loading treatment visible until there is something to measure. */
export function glimpseFits(available: number, rowBottom: number | null): boolean {
  if (rowBottom == null) return true;
  return rowBottom <= available + 0.5;
}

export type GateScope = 'circle' | 'club' | 'everyone';

/** CB14 — the sheet's one outbound link. England is the only supported
 *  provider (whsCountries.ts), so it is the only route we can honour; the
 *  Scotland/Wales/Ireland links CB13 shipped were deleted because following
 *  them cannot end in a connectable handicap. "Join a club" opens /courses. */
const GATE_LINKS = {
  england: 'https://www.englandgolf.org/igolf',
} as const;

function GateCard({ onConnect, onNoHandicap, roundCount, scope }: {
  onConnect: () => void; onNoHandicap: () => void; roundCount?: number | null; scope?: GateScope | null;
}) {
  const { t } = useTranslation('courses');
  const bullets = [
    t('amateur.gate.bulletCourses'),
    t('amateur.gate.bulletIndex'),
    t('amateur.gate.bulletComps'),
  ];
  /* CB36 — the live count for the scope the landing ladder chose; without a
     settled positive count and a scope, the CB17 sentence stands. */
  const counted = roundCount != null && roundCount > 0 && scope != null;
  const restKey = scope === 'circle' ? 'bodyRestCircle' : scope === 'club' ? 'bodyRestClub' : 'bodyRestEveryone';
  return (
    <div
      data-rounds-gate-card=""
      style={{
        padding: '14px 15px 20px',
      }}
    >
      <div style={{ ...EYEBROW, lineHeight: 1, color: A.AMBER }}>{t('amateur.gate.eyebrow')}</div>
      <div style={{ marginTop: 8, fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.16, color: A.INK }}>
        {t('amateur.gate.title')}
      </div>
      <div data-rounds-gate-body="" style={{ marginTop: 9, fontSize: 13, fontWeight: 600, color: A.BODY, lineHeight: 1.5 }}>
        {counted ? (
          <>
            <span data-rounds-gate-count="" style={{ color: A.AMBER, fontWeight: 700 }}>
              {t('amateur.gate.bodyCount', { count: roundCount as number })}
            </span>{' '}
            {t(`amateur.gate.${restKey}`)}
          </>
        ) : t('amateur.gate.body')}
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bullets.map((line) => (
          <div key={line} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, fontWeight: 600, color: A.BODY, lineHeight: 1.4 }}>
            <span aria-hidden style={{ flex: 'none', width: 4.5, height: 4.5, borderRadius: 999, background: A.AMBER, marginTop: 5.5 }} />
            <span>{line}</span>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        type="button"
        onClick={onConnect}
        style={{
          marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 7,
          minHeight: 44, height: 'auto', width: 'auto', border: 0, cursor: 'pointer',
          background: 'transparent', color: A.INK, borderRadius: 0, padding: 0,
          fontFamily: SANS, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', textAlign: 'left',
        }}
      >
        {t('amateur.gate.cta')}
        <ChevronRight size={15} style={{ width: 15, height: 15 }} />
      </Button>
      {/* The quiet second path: the SeeAll treatment (EYEBROW, A.MUTE, 13px
          chevron), left-aligned under the text action (CB35). */}
      <button
        type="button"
        onClick={onNoHandicap}
        style={{
          marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 4, width: '100%',
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
  const { t: tH } = useTranslation('handicap');
  const navigate = useNavigate();
  const rows: ({ key: 'england' | 'club' } & ({ href: string; to?: never } | { to: string; href?: never }))[] = [
    { key: 'england', href: GATE_LINKS.england },
    { key: 'club', to: '/courses' },
  ];
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
          {rows.map((r, index) => {
            const body = (
              <>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: A.INK }}>{t(`amateur.gate.${r.key}`)}</span>
                  <span style={{ display: 'block', marginTop: 3, fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, color: A.MUTE }}>{t(`amateur.gate.${r.key}Sub`)}</span>
                </span>
                <ChevronRight size={13} style={{ flex: 'none', color: A.MUTE }} />
              </>
            );
            const rowStyle: CSSProperties = {
              display: 'flex', alignItems: 'center', gap: 11, width: '100%',
              padding: '11px 0', border: 0, borderBottom: index === rows.length - 1 ? undefined : `1px solid ${A.SOFT}`,
              background: 'transparent', textAlign: 'left', fontFamily: SANS,
            };
            return (
              <Button variant="ghost" key={r.key} type="button" onClick={() => {
                analyticsEvents.track('rounds_gate_sheet_row_tap', { gate_state: 'gated', row: r.key });
                if (r.href) window.open(r.href, '_blank', 'noopener,noreferrer');
                else if (r.to) { onClose(); navigate(r.to); }
              }} style={{ ...rowStyle, cursor: 'pointer', height: 'auto', borderRadius: 0, whiteSpace: 'normal' }}>
                {body}
              </Button>
            );
          })}
        </div>
        {/* CB14 — renders the shared connect-page sentence from connectReach(). */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${A.SOFT}`, fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, color: A.MUTE }}>
            {tH('whsConnect.intro.endLine', connectReach())}
          </div>
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

/** The gated render (CB34): one page, one flow. The real page, cropped and
 *  faded, is an inert in-flow header; the gate copy follows it on the page's
 *  own canvas. Not a sheet, not a layer. */
export function RoundsGate({ children, roundCount = null, scope = null }: {
  children: ReactNode;
  /** CB36 — pool_rounds from the board read the page already holds. */
  roundCount?: number | null;
  scope?: GateScope | null;
}) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const impressionTracked = useRef(false);

  useEffect(() => {
    if (impressionTracked.current) return;
    impressionTracked.current = true;
    analyticsEvents.track('rounds_gate_viewed', { gate_state: 'gated' });
  }, []);

  /* CB36 — the short-screen rule. The glimpse box is a flex remainder; when
     the first round row's bottom does not fit inside it, the glimpse is not
     rendered and an empty remainder keeps the block on the nav. The last
     measured row bottom decides when it returns (window resize re-runs this;
     no observer, no fixed height). */
  const boxRef = useRef<HTMLDivElement>(null);
  const rowBottom = useRef<number | null>(null);
  const [showGlimpse, setShowGlimpse] = useState(true);
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    window.addEventListener('resize', bump);
    return () => window.removeEventListener('resize', bump);
  }, []);
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const available = box.clientHeight;
    if (showGlimpse) {
      const row = box.querySelector(GLIMPSE_ROW);
      if (!row) return;
      rowBottom.current = row.getBoundingClientRect().bottom - box.getBoundingClientRect().top;
      if (!glimpseFits(available, rowBottom.current)) setShowGlimpse(false);
    } else if (rowBottom.current != null && glimpseFits(available, rowBottom.current)) {
      setShowGlimpse(true);
    }
  });

  return (
    <div data-rounds-gate="" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {showGlimpse ? (
        <div
          ref={(el) => { boxRef.current = el; el?.setAttribute('inert', ''); }}
          aria-hidden
          data-rounds-gate-header=""
          style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden', ...FROST }}
        >
          {children}
        </div>
      ) : (
        <div ref={boxRef} aria-hidden data-rounds-gate-spacer="" style={{ flex: '1 1 0', minHeight: 0 }} />
      )}
      <div style={{ flexShrink: 0 }}>
        <GateCard roundCount={roundCount} scope={scope} onConnect={() => {
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
