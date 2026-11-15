/**
 * THE GUEST JOIN CARD (brief §3, signed-off mock frames 2–4).
 *
 * Built on the RoundsGate pattern: shade and card portal to body at
 * Z.bottomNav - 2 / - 1 so the nav stays expanded and usable above them
 * (pushForceExpand lease), the page scroller is locked while the card is up,
 * and islands / the scrolled band (Z.header) stay above the shade.
 *
 * Two forms: closable (action card and Join free — 30px X, aria-label
 * "Close", headline padded right 30) and the scroll-triggered form with NO
 * close button (the nav is the way out).
 *
 * Apple and Google buttons show only where AuthHeroScreen shows them today
 * (inMedian); email always shows. Reduced motion: no rise, no fade.
 */
import React, { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, X } from 'lucide-react';
import { Z } from '@/config/zIndex';
import { GUEST_RAISED_Z, useGuestCourseSheetOpen } from './guestGateStore';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { pushForceExpand } from '@/hooks/useScrollDirection';
import { isMedianApp } from '@/utils/median/isMedianApp';
import { AppleLogo, GoogleLogo } from '@/pages/auth/components/AuthHeroScreen';
import type { GuestCardCopy } from './guestCopy';
import { GUEST_CARD_CHROME_COPY } from './guestCopy';
import type { GuestGateChoice } from './guestAnalytics';
import './guestGate.css';

export interface GuestJoinCardProps {
  copy: GuestCardCopy;
  /** Closable form (action card, Join free). The scroll-triggered card has no close. */
  closable: boolean;
  onChoice: (choice: GuestGateChoice) => void;
  onClose: () => void;
}

export const GuestJoinCard: React.FC<GuestJoinCardProps> = ({ copy, closable, onChoice, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Nav stays expanded and usable while the card is up.
  useLayoutEffect(() => pushForceExpand(), []);

  // Page scroll locked while the card is up (RoundsGate's rule: lock the
  // #root scroller, falling back to the body lock).
  useLayoutEffect(() => {
    const scroller = getPrimaryScrollElement();
    if (scroller && scroller !== document.documentElement && scroller !== document.body) {
      const overflow = scroller.style.overflow;
      const overflowY = scroller.style.overflowY;
      scroller.style.overflow = 'hidden';
      return () => {
        scroller.style.overflow = overflow;
        scroller.style.overflowY = overflowY;
      };
    }
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  useLayoutEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, []);

  const inMedian = isMedianApp();
  // Stage 2.3: above an open course sheet; nav is raised above both.
  const raised = useGuestCourseSheetOpen();

  return createPortal(
    <>
      <div data-guest-gate-shade="" aria-hidden="true" className="guest-gate-shade guest-gate-enter" style={{ zIndex: raised ? GUEST_RAISED_Z.shade : Z.bottomNav - 2 }} />
      <div
        ref={cardRef}
        data-guest-gate-card=""
        className="guest-gate-card guest-gate-enter"
        role="dialog"
        aria-modal="false"
        aria-label={copy.kicker}
        tabIndex={-1}
        style={{ zIndex: raised ? GUEST_RAISED_Z.card : Z.bottomNav - 1 }}
      >
        {closable && (
          <button type="button" className="guest-gate-close" aria-label={GUEST_CARD_CHROME_COPY.close} onClick={onClose}>
            <X size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}
        <div className="guest-gate-kicker">{copy.kicker}</div>
        <h2 className={closable ? 'guest-gate-head guest-gate-head--closable' : 'guest-gate-head'}>
          {copy.headline.map((part, i) =>
            part.amber ? (
              <span key={i} className="guest-gate-amber">
                {part.text}
              </span>
            ) : (
              <React.Fragment key={i}>{part.text}</React.Fragment>
            ),
          )}
        </h2>
        <p className="guest-gate-body">{copy.body}</p>
        {inMedian && (
          <div className="guest-gate-circles">
            <button
              type="button"
              className="guest-gate-circ"
              aria-label={GUEST_CARD_CHROME_COPY.apple}
              onClick={() => onChoice('apple')}
            >
              <AppleLogo size={22} color="#F8FAFC" />
            </button>
            <button
              type="button"
              className="guest-gate-circ"
              aria-label={GUEST_CARD_CHROME_COPY.google}
              onClick={() => onChoice('google')}
            >
              <GoogleLogo size={21} />
            </button>
          </div>
        )}
        {inMedian && <div className="guest-gate-or">or</div>}
        <button
          type="button"
          className={`guest-gate-pill${inMedian ? '' : ' guest-gate-pill--first'}`}
          onClick={() => onChoice('email')}
        >
          <Mail size={18} strokeWidth={2} aria-hidden="true" />
          <span>{GUEST_CARD_CHROME_COPY.email}</span>
        </button>
        <button type="button" className="guest-gate-login" onClick={() => onChoice('login')}>
          {GUEST_CARD_CHROME_COPY.login}
          <span className="guest-gate-login-caret" aria-hidden="true">
            ›
          </span>
        </button>
      </div>
    </>,
    document.body,
  );
};

export default GuestJoinCard;
