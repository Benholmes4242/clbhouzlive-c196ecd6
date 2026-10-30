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
import { X } from 'lucide-react';
import { Z } from '@/config/zIndex';
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

  return createPortal(
    <>
      <div data-guest-gate-shade="" aria-hidden="true" className="guest-gate-shade guest-gate-enter" style={{ zIndex: Z.bottomNav - 2 }} />
      <div
        ref={cardRef}
        data-guest-gate-card=""
        className="guest-gate-card guest-gate-enter"
        role="dialog"
        aria-modal="false"
        aria-label={copy.kicker}
        tabIndex={-1}
        style={{ zIndex: Z.bottomNav - 1 }}
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
          <button
            type="button"
            className="guest-gate-btn guest-gate-btn--apple"
            onClick={() => onChoice('apple')}
          >
            <AppleLogo size={17} color="#0A0A0C" />
            <span>{GUEST_CARD_CHROME_COPY.apple}</span>
          </button>
        )}
        {inMedian && (
          <button
            type="button"
            className={`guest-gate-btn guest-gate-btn--ghost${inMedian ? '' : ' guest-gate-btn--first'}`}
            onClick={() => onChoice('google')}
          >
            <GoogleLogo size={18} />
            <span>{GUEST_CARD_CHROME_COPY.google}</span>
          </button>
        )}
        <button
          type="button"
          className={`guest-gate-btn guest-gate-btn--ghost${inMedian ? '' : ' guest-gate-btn--first'}`}
          onClick={() => onChoice('email')}
        >
          <span>{GUEST_CARD_CHROME_COPY.email}</span>
        </button>
        <button type="button" className="guest-gate-login" onClick={() => onChoice('login')}>
          {GUEST_CARD_CHROME_COPY.login}
        </button>
      </div>
    </>,
    document.body,
  );
};

export default GuestJoinCard;
