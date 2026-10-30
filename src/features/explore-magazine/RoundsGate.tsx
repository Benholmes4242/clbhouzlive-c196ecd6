/**
 * CB13 — THE HANDICAP GATE ON THE ROUNDS TAB: look, then lock.
 * 28 Oct 2026: free look, then lock beyond 80px from the scroll position at mount
 * or 3 seconds (founder sign-off).
 * ScoresLeaderboardsPage mounts this only for gated; its four-state predicate,
 * CB45 failed-read fallback and existing reads/count source stay authoritative.
 * The real full-height page is accessible until lock; only its body then becomes
 * inert. CB39 scope stays hidden; islands, Rounds/Watch and nav remain live.
 * Scroll ownership is the canonical #root container via getPrimaryScrollElement.
 * Timers/listeners/observer belong to this mount, never storage. Gate and tile
 * share connect CTA styles and floating glass; tile owns modal focus/aria lifecycle.
 * Locked gates hold the canonical nav expansion lease; the nav uses Z.bottomNav,
 * above the body-level shade/card at Z.bottomNav - 2/-1 (no separate nav mount).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Flag, Star } from 'lucide-react';
import { hideOthers } from 'aria-hidden';
import { Button } from '@/components/ui/button';
import { primaryCtaStyle, declineButtonStyle } from '@/components/profile/handicap/whs/connect/EmptyStateScreen';
import { GLASS_CARD, GLASS_BACKDROP } from '@/lib/tokens/glass';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';
import { pushForceExpand } from '@/hooks/useScrollDirection';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { Z } from '@/config/zIndex';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useIsGuest } from '@/features/guest/useIsGuest';
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


export type GateScope = 'circle' | 'club' | 'everyone';
export const GATE_LINKS = { england: 'https://www.englandgolf.org/igolf' } as const;

function NoHandicapTile({ onClose, returnRef }: { onClose: () => void; returnRef: React.RefObject<HTMLButtonElement> }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const location = useLocation();
  const initialLocation = useRef(location.key);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (location.key !== initialLocation.current) closeRef.current();
  }, [location.key]);
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const restore = hideOthers(card);
    card.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const buttons = Array.from(card.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === card)) {
        event.preventDefault(); last?.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === card)) {
        event.preventDefault(); first?.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { restore(); window.removeEventListener('keydown', onKey); returnRef.current?.focus({ preventScroll: true }); };
  }, [returnRef]);
  return createPortal(<>
    <div data-rounds-gate-tile-backdrop="" aria-hidden="true" className="rounds-gate-tile-backdrop" style={{ ...GLASS_BACKDROP, zIndex: Z.header + 2 }} onClick={onClose} />
    <div ref={cardRef} data-rounds-gate-tile="" className="rounds-gate-floating" role="dialog" aria-modal="true" aria-labelledby="rounds-gate-tile-title" tabIndex={-1} style={{ ...GLASS_CARD, zIndex: Z.header + 3 }}>
      <div className="rounds-gate-kicker rounds-gate-quiet">{t('amateur.gate.sheetEyebrow')}</div>
      <h2 id="rounds-gate-tile-title" className="rounds-gate-head rounds-gate-tile-head">{t('amateur.gate.tileTitle')}</h2>
      <p className="rounds-gate-copy">{t('amateur.gate.tileBody')}</p>
      <div className="rounds-gate-options">
        {(['england', 'club'] as const).map(row => {
          const Icon = row === 'england' ? Flag : Star;
          return <Button key={row} variant="ghost" className="rounds-gate-option" onClick={() => {
            analyticsEvents.track('rounds_gate_sheet_row_tap', { gate_state: 'gated', row });
            if (row === 'england') window.open(GATE_LINKS.england, '_blank', 'noopener,noreferrer');
            else { onClose(); navigate('/courses'); }
          }}><span className="rounds-gate-icon"><Icon size={17} strokeWidth={2} /></span><span className="rounds-gate-option-text"><span className="rounds-gate-option-title">{t(`amateur.gate.${row}`)}</span><span className="rounds-gate-option-sub">{t(`amateur.gate.${row}Sub`)}</span></span><ChevronRight size={16} strokeWidth={2} className="rounds-gate-chevron" /></Button>;
        })}
      </div>
      <Button style={{ ...primaryCtaStyle, marginTop: 16 }} onClick={() => { onClose(); navigate('/manage/handicap'); }}>{t('amateur.gate.sheetConnect')}</Button>
    </div>
  </>, document.body);
}

function GateCard({ roundCount, scope, onConnect, onNoHandicap, declineRef }: {
  roundCount: number | null; scope: GateScope | null; onConnect: () => void; onNoHandicap: () => void; declineRef: React.RefObject<HTMLButtonElement>;
}) {
  const { t } = useTranslation('courses');
  const cardRef = useRef<HTMLDivElement>(null);
  const counted = roundCount != null && roundCount > 0 && scope != null;
  const restKey = scope === 'circle' ? 'headRestCircle' : scope === 'club' ? 'headRestClub' : 'headRestEveryone';
  useLayoutEffect(() => { cardRef.current?.focus({ preventScroll: true }); }, []);
  return createPortal(<div ref={cardRef} data-rounds-gate-card="" className="rounds-gate-floating rounds-gate-enter" role="dialog" aria-modal="false" aria-labelledby="rounds-gate-title" tabIndex={-1} style={{ ...GLASS_CARD, zIndex: Z.bottomNav - 1 }}>
    <div className="rounds-gate-kicker">{t('amateur.gate.membersKicker')}</div>
    <h2 id="rounds-gate-title" className="rounds-gate-head">{counted ? <><span data-rounds-gate-count="" className="rounds-gate-amber">{t('amateur.gate.bodyCount', { count: roundCount })}</span>{' '}{t(`amateur.gate.${restKey}`)}</> : t('amateur.gate.title')}</h2>
    <p className="rounds-gate-copy">{t('amateur.gate.lockBody')}</p>
    <div data-rounds-gate-ghost="" aria-hidden="true" className="rounds-gate-ghost">
      <span className="rounds-gate-you-slot">{t('amateur.gate.ghostName')}</span>
      <span className="rounds-gate-ghost-text"><span className="rounds-gate-ghost-name">{t('amateur.gate.ghostName')}</span><span className="rounds-gate-ghost-sub">{t('amateur.gate.ghostSub')}</span></span>
      <span className="rounds-gate-ghost-col"><span /></span><span className="rounds-gate-ghost-col rounds-gate-ghost-gross"><span /></span>
    </div>
    <Button style={{ ...primaryCtaStyle, marginTop: 14 }} onClick={onConnect}>{t('amateur.gate.cta')}</Button>
    <Button ref={declineRef} variant="ghost" style={{ ...declineButtonStyle, marginTop: 10, minHeight: 36, lineHeight: 1.5 }} onClick={onNoHandicap}>{t('amateur.gate.noHandicap')}</Button>
  </div>, document.body);
}

export function RoundsGate({ children, roundCount = null, scope = null }: { children: ReactNode; roundCount?: number | null; scope?: GateScope | null }) {
  const navigate = useNavigate();
  // GUEST BROWSING §4: RoundsGate never shows to a guest — the guest join
  // card takes precedence on Explore. The page renders ungated; the guest
  // surface gate owns the lock.
  const isGuest = useIsGuest();
  const [locked, setLocked] = useState(false);
  const [tileOpen, setTileOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const declineRef = useRef<HTMLButtonElement>(null);
  const impressionTracked = useRef(false);
  const lookTracked = useRef(false);
  useEffect(() => {
    if (!lookTracked.current) { lookTracked.current = true; analyticsEvents.track('rounds_gate_look_started', { gate_state: 'gated' }); }
    if (impressionTracked.current) return;
    const scroller = getPrimaryScrollElement();
    const target = scroller === document.documentElement || scroller === document.body ? window : scroller;
    const startTop = scroller?.scrollTop ?? 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    let observer: MutationObserver | undefined;
    let timerStarted = false;
    const cleanup = () => { clearTimeout(timer); clearTimeout(fallback); observer?.disconnect(); target?.removeEventListener('scroll', onScroll); };
    const lock = (trigger: 'scroll' | 'timer') => {
      if (impressionTracked.current) return;
      impressionTracked.current = true;
      cleanup();
      setLocked(true);
      analyticsEvents.track('rounds_gate_viewed', { gate_state: 'gated', trigger });
    };
    const onScroll = () => { if (Math.abs((scroller?.scrollTop ?? 0) - startTop) > 80) lock('scroll'); };
    const startTimer = () => {
      if (timerStarted || impressionTracked.current) return;
      timerStarted = true;
      observer?.disconnect(); clearTimeout(fallback);
      timer = setTimeout(() => lock('timer'), 3000);
    };
    const checkRow = () => { if (wrapperRef.current?.querySelector('[data-standout-row], [data-board-row]')) startTimer(); };
    observer = new MutationObserver(checkRow);
    if (wrapperRef.current) observer.observe(wrapperRef.current, { childList: true, subtree: true });
    fallback = setTimeout(startTimer, 8000);
    target?.addEventListener('scroll', onScroll, { passive: true });
    checkRow();
    return cleanup;
  }, []);
  useLayoutEffect(() => {
    if (locked) return pushForceExpand();
  }, [locked]);
  useLayoutEffect(() => {
    if (!locked) return;
    const body = bodyRef.current;
    body?.setAttribute('inert', '');
    const scroller = getPrimaryScrollElement();
    if (scroller && scroller !== document.documentElement && scroller !== document.body) {
      const overflow = scroller.style.overflow;
      const overflowY = scroller.style.overflowY;
      scroller.style.overflow = 'hidden';
      return () => { scroller.style.overflow = overflow; scroller.style.overflowY = overflowY; body?.removeAttribute('inert'); };
    }
    lockBodyScroll();
    return () => { unlockBodyScroll(); body?.removeAttribute('inert'); };
  }, [locked]);
  return <div ref={wrapperRef} data-rounds-gate="" data-rounds-locked={locked ? '' : undefined}>
    <div ref={bodyRef} data-rounds-gate-body="" aria-hidden={locked ? true : undefined}>{children}</div>
    {locked ? <>
      {createPortal(<div data-rounds-gate-shade="" aria-hidden="true" className="rounds-gate-shade" style={{ zIndex: Z.bottomNav - 2 }} />, document.body)}
      <GateCard roundCount={roundCount} scope={scope} declineRef={declineRef} onConnect={() => { analyticsEvents.track('rounds_gate_connect_tap', { gate_state: 'gated' }); navigate('/manage/handicap'); }} onNoHandicap={() => { analyticsEvents.track('rounds_gate_no_handicap_tap', { gate_state: 'gated' }); setTileOpen(true); }} />
      {tileOpen ? <NoHandicapTile onClose={() => setTileOpen(false)} returnRef={declineRef} /> : null}
    </> : null}
  </div>;
}
