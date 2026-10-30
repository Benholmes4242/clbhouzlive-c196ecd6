/**
 * GUEST GATE HOST — the one renderer of the guest join card.
 *
 * Mounted once inside the router. Renders the card when:
 *   - a card request is open (scroll trigger, action tap, Join free), or
 *   - the current surface is already locked this session (returning to a
 *     locked surface re-shows the scroll card at the top).
 *
 * Owns the card's choices: apple/google/email hand off to /auth with a
 * start intent (AuthForm runs the conversion), login goes to the normal
 * sign-in, close dismisses the closable form. Every choice is tracked.
 */
import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsGuest } from './useIsGuest';
import {
  closeGuestCard,
  getGuestCardRequest,
  isSurfaceLocked,
  openGuestCard,
  surfaceForPath,
  useGuestCardRequest,
  type GuestSurfaceKey,
} from './guestGateStore';
import { guestActionCopy, guestSurfaceCopy, type GuestCardCopy } from './guestCopy';
import { trackGuestGateChoice, trackGuestGateShown, type GuestGateChoice } from './guestAnalytics';
import { GuestJoinCard } from './GuestJoinCard';

export const GuestGateHost: React.FC = () => {
  const isGuest = useIsGuest();
  const location = useLocation();
  const navigate = useNavigate();
  const request = useGuestCardRequest();
  const surface = surfaceForPath(location.pathname);

  // Returning to a locked surface re-shows the scroll card at the top.
  useEffect(() => {
    if (!isGuest || !surface) return;
    if (isSurfaceLocked(surface) && !getGuestCardRequest()) {
      openGuestCard({ kind: 'scroll', surface });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, surface, location.key]);

  const active = useMemo(() => {
    if (!isGuest) return null;
    if (request) return request;
    if (surface && isSurfaceLocked(surface)) return { kind: 'scroll', surface } as const;
    return null;
  }, [isGuest, request, surface]);

  if (!active) return null;

  const copy: GuestCardCopy =
    active.kind === 'action'
      ? guestActionCopy(active.action, { firstName: active.firstName, postKind: active.postKind })
      : guestSurfaceCopy(active.surface);

  const activeSurface: GuestSurfaceKey | null = active.surface;
  const closable = active.kind !== 'scroll';

  const onChoice = (choice: GuestGateChoice) => {
    trackGuestGateChoice({ surface: activeSurface, choice });
    if (choice === 'close') {
      closeGuestCard();
      return;
    }
    if (choice === 'login') {
      closeGuestCard();
      navigate('/auth');
      return;
    }
    closeGuestCard();
    navigate(`/auth?guest=1&start=${choice}`);
  };

  return <GuestJoinCard copy={copy} closable={closable} onChoice={onChoice} onClose={() => onChoice('close')} />;
};

export default GuestGateHost;
